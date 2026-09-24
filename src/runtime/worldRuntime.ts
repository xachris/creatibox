import type { CreatiBoxProject, Entity, Vec2 } from '../model/types'
import { isRaceParticipant, normalizeProject, validateRaceCapability } from '../model/race'
import {
  applyInteractionRule,
  closingSpeed,
  intersects,
  isMovableBody,
  isShovableBody,
  isSolidBody,
  matchingRule,
  overlapManifold,
} from './rules'

/** Soft bumps only separate; harder hits also damage / shove. */
const IMPACT_DAMAGE_SPEED = 80
/** Prevents side-by-side grinding from deleting durability every physics tick. */
const IMPACT_COOLDOWN = 0.55

export type RunPhase = 'countdown' | 'racing' | 'finished'

/** An isolated run of the shared world model; all interactions use world rules. */
export class WorldRuntime {
  readonly project: CreatiBoxProject
  readonly player: Entity
  readonly participants: Entity[]
  /** Legacy read-only API for existing integrations. */
  get cars() { return this.participants }
  readonly contacts = new Set<string>()
  /** New impact contacts observed during the latest public step (for SFX/UI). */
  readonly collisionEvents = new Set<string>()
  /** Last time an impulse/damage fired for a contact pair. */
  readonly impulseAt = new Map<string, number>()
  readonly finishOrder: string[] = []
  phase: RunPhase = 'countdown'
  countdown = 3
  elapsed = 0

  constructor(source: CreatiBoxProject) {
    this.project = normalizeProject(source)
    const world = this.project.world
    world.entities.forEach(validateRaceCapability)
    const players = world.entities.filter(e => isRaceParticipant(e) && e.controlRole === 'player')
    const player = players[0]
    if (players.length > 1) throw new Error('必须恰好一个玩家参赛者；当前存在多个玩家。')
    if (!player) throw new Error('缺少玩家车/参赛者。请启用 race 并将一个参赛者设为玩家控制。')
    if (!world.trackPath || world.trackPath.length < 2 || world.trackPath.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)) || world.trackPath.every(p => p.x === world.trackPath![0].x && p.y === world.trackPath![0].y)) {
      throw new Error('缺少有效赛道路径（trackPath）。请进入编辑，使用“快速比赛”生成赛道。')
    }
    if (!world.entities.some(e => e.kind === 'finish') || world.entities.filter(isRaceParticipant).some(e => !world.entities.filter(t => t.kind === 'finish').some(t => matchingRule(world.rules, e, t)?.effect === 'finish'))) {
      throw new Error('缺少终点或完赛规则。请进入编辑，使用“快速比赛”重新生成完整赛道。')
    }
    this.player = player
    this.participants = world.entities.filter(isRaceParticipant)
    for (const entity of this.participants) {
      if (!['player', 'computer'].includes(entity.controlRole ?? '')) throw new Error(`${entity.name}: controlRole 无效`)
    }
    for (const rule of world.rules) {
      if ((rule.sourceKind && rule.sourceCapability) || (rule.targetKind && rule.targetCapability)) throw new Error('规则 kind 与 capability 选择器不能同时使用')
    }
    for (const car of this.participants) {
      car.speed = 0
      car.state = car.durability <= 0 ? 'Broken' : 'Idle'
      car.waypointIndex = 1
    }
  }

  step(seconds: number, keys: ReadonlySet<string>) {
    this.collisionEvents.clear()
    if (!Number.isFinite(seconds) || seconds <= 0 || this.phase === 'finished') return
    // Bound background-tab gaps and substep movement to avoid tunneling.
    let remaining = Math.min(seconds, 0.1)
    while (remaining > 1e-8) {
      const dt = Math.min(remaining, 1 / 120)
      remaining -= dt
      this.tick(dt, keys)
      if ((this.phase as RunPhase) === 'finished') break
    }
  }

  private tick(dt: number, keys: ReadonlySet<string>) {
    if (this.phase === 'countdown') {
      this.countdown = Math.max(0, this.countdown - dt)
      if (this.countdown < 1e-8) { this.countdown = 0; this.phase = 'racing' }
      return
    }
    this.elapsed += dt
    const world = this.project.world
    const path = world.trackPath!
    for (const car of this.participants) {
      if (car.state === 'Finished' || car.state === 'Broken') continue
      if (car.controlRole === 'computer') updateComputerParticipant(car, path, dt, this.participants)
      else updatePlayerParticipant(car, dt, keys)
      const index = car.waypointIndex ?? 1
      if (index < path.length - 1 && Math.hypot(path[index].x - car.position.x, path[index].y - car.position.y) < 110) {
        car.waypointIndex = index + 1
      }
    }

    // Resolve solids after movement so overlaps never persist into the next frame.
    resolvePhysics(
      world.entities,
      world.rules,
      this.contacts,
      this.collisionEvents,
      this.impulseAt,
      this.elapsed,
      path,
      this.finishOrder,
    )

    if (this.player.state === 'Finished' || this.player.state === 'Broken') {
      this.phase = 'finished'
      for (const car of this.participants) car.speed = 0
    }
  }
}

function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
}

function updateComputerParticipant(car: Entity, path: Vec2[], dt: number, participants: Entity[]) {
  if (path.length < 2 || car.state === 'Finished' || car.state === 'Broken') return
  const index = Math.min(car.waypointIndex ?? 1, path.length - 1)
  const target = path[index]
  let dx = target.x - car.position.x
  let dy = target.y - car.position.y
  let trafficLimit = Infinity
  // Shared local overtaking: steer around slower bodies before touching them.
  const heading = Math.atan2(dy, dx)
  for (const other of participants) {
    if (other === car || other.state === 'Finished') continue
    const ox = other.position.x - car.position.x, oy = other.position.y - car.position.y
    const ahead = ox * Math.cos(heading) + oy * Math.sin(heading)
    const lateral = -ox * Math.sin(heading) + oy * Math.cos(heading)
    const clearance = (car.size.y + other.size.y) / 2 + 12
    if (ahead > 0 && ahead < (car.size.x + other.size.x) / 2 + 130 && Math.abs(lateral) < clearance && other.speed < car.race!.maxSpeed) {
      const side = lateral >= 0 ? -1 : 1
      dx = Math.cos(heading) * 110 - Math.sin(heading) * side * (clearance + 20)
      dy = Math.sin(heading) * 110 + Math.cos(heading) * side * (clearance + 20)
      trafficLimit = Math.min(trafficLimit, Math.max(35, other.speed))
      break
    }
  }

  const desired = Math.atan2(dy, dx)
  const delta = normalizeAngle(desired - car.rotation)
  const turnRate = car.race!.turnRate * (car.opponentProfile === 'easy' ? 0.69 : car.opponentProfile === 'fast' ? 1.1 : 0.9)
  car.rotation += Math.max(-turnRate * dt, Math.min(turnRate * dt, delta))

  const acceleration = car.race!.acceleration * (car.opponentProfile === 'easy' ? 0.64 : car.opponentProfile === 'fast' ? 0.94 : 0.79)
  // Slow before sharp bends so every profile can stay near the waypoint path.
  const limit = Math.min(trafficLimit, car.race!.maxSpeed, Math.abs(delta) > 0.35 ? 100 : car.race!.maxSpeed)
  car.speed = Math.max(0, Math.min(limit, car.speed + acceleration * dt))
  car.position.x += Math.cos(car.rotation) * car.speed * dt
  car.position.y += Math.sin(car.rotation) * car.speed * dt
  car.state = 'Moving'
}

function updatePlayerParticipant(car: Entity, dt: number, keys: ReadonlySet<string>) {
  if (car.state === 'Broken' || car.state === 'Finished') return

  const controls = car.controls ?? {
    accelerate: 'arrowup',
    brake: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    primary: ' ',
  }

  const forward = keys.has(controls.accelerate.toLowerCase())
  const primary = controls.primary ? keys.has(controls.primary.toLowerCase()) : false
  const braking = keys.has(controls.brake.toLowerCase())
  const left = keys.has(controls.left.toLowerCase())
  const right = keys.has(controls.right.toLowerCase())

  if (forward || primary) car.speed = Math.min(car.race!.maxSpeed, car.speed + (car.race!.acceleration * (primary ? 210 / 165 : 1)) * dt)
  else car.speed = Math.max(0, car.speed - (car.movementStyle === 'runner' ? car.race!.brakePower : 60) * dt)

  if (braking) car.speed = Math.max(0, car.speed - car.race!.brakePower * dt)

  const turn = (right ? 1 : 0) - (left ? 1 : 0)
  car.rotation += turn * car.race!.turnRate * dt * (car.movementStyle === 'runner' ? 1 : Math.max(0.25, car.speed / Math.max(car.race!.maxSpeed, 1)))

  if (car.speed > 0) {
    car.state = 'Moving'
    car.position.x += Math.cos(car.rotation) * car.speed * dt
    car.position.y += Math.sin(car.rotation) * car.speed * dt
  } else if (car.state === 'Moving') {
    car.state = 'Idle'
  }
}

function contactKey(a: Entity, b: Entity) {
  return a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
}

function separateBodies(a: Entity, b: Entity, nx: number, ny: number, depth: number) {
  const aShove = isShovableBody(a)
  const bShove = isShovableBody(b)
  const aLive = isMovableBody(a)
  const bLive = isMovableBody(b)
  const pad = depth + 0.5

  if (aShove && bShove) {
    // Live cars share the push; a wreck takes a smaller shove so it can be cleared.
    let aShare = 0.5
    let bShare = 0.5
    if (aLive && !bLive) { aShare = 0.82; bShare = 0.18 }
    else if (!aLive && bLive) { aShare = 0.18; bShare = 0.82 }
    a.position.x -= nx * pad * aShare
    a.position.y -= ny * pad * aShare
    b.position.x += nx * pad * bShare
    b.position.y += ny * pad * bShare
  } else if (aShove) {
    a.position.x -= nx * pad
    a.position.y -= ny * pad
  } else if (bShove) {
    b.position.x += nx * pad
    b.position.y += ny * pad
  }
}

/** Arcade bumper impulse. */
function applyImpact(a: Entity, b: Entity, nx: number, ny: number, closing: number) {
  if (closing <= 0) return

  const aMove = isMovableBody(a)
  const bMove = isMovableBody(b)

  if (aMove && bMove) {
    a.speed = Math.max(0, a.speed - closing * 0.55)
    b.speed = Math.min(b.race!.maxSpeed, Math.max(0, b.speed - closing * 0.2) + closing * 0.18)
    const yaw = Math.atan2(ny, nx) * 0.05
    a.rotation -= yaw
    b.rotation += yaw
  } else if (aMove) {
    a.speed = Math.max(0, a.speed * 0.42 - closing * 0.15)
  } else if (bMove) {
    b.speed = Math.max(0, b.speed * 0.42 - closing * 0.15)
  }
}

/** While scraping a static solid, kill the speed component digging into it. */
function dampAgainstStatic(movable: Entity, nx: number, ny: number, movableIsA: boolean) {
  if (!isMovableBody(movable) || movable.speed <= 0) return
  const hx = Math.cos(movable.rotation)
  const hy = Math.sin(movable.rotation)
  const into = movableIsA ? hx * nx + hy * ny : -(hx * nx + hy * ny)
  if (into > 0) movable.speed *= Math.max(0, 1 - into * 0.85)
}

function fireDamageRules(
  a: Entity,
  b: Entity,
  rules: CreatiBoxProject['world']['rules'],
  closing: number,
) {
  if (closing < IMPACT_DAMAGE_SPEED) return
  if (isRaceParticipant(a) && isRaceParticipant(b)) {
    const rule = matchingRule(rules, a, b)
    if (rule) applyInteractionRule(a, b, rule)
    return
  }
  if (isRaceParticipant(a)) {
    const rule = matchingRule(rules, a, b)
    if (rule) applyInteractionRule(a, b, rule)
  }
  if (isRaceParticipant(b)) {
    const rule = matchingRule(rules, b, a)
    if (rule) applyInteractionRule(b, a, rule)
  }
}

function resolvePair(
  a: Entity,
  b: Entity,
  rules: CreatiBoxProject['world']['rules'],
  activeContacts: Set<string>,
  collisionEvents: Set<string>,
  impulseAt: Map<string, number>,
  elapsed: number,
  finishOrder: string[],
  path: Vec2[],
  impulseThisFrame: Set<string>,
) {
  // Finish is a trigger gate, not a solid bumper.
  if (a.kind === 'finish' || b.kind === 'finish') {
    const car = isRaceParticipant(a) ? a : isRaceParticipant(b) ? b : null
    const finish = a.kind === 'finish' ? a : b.kind === 'finish' ? b : null
    if (!car || !finish || car.state === 'Finished' || car.state === 'Broken') return
    if ((car.waypointIndex ?? 1) < path.length - 1) return
    if (!intersects(car, finish)) {
      activeContacts.delete(contactKey(car, finish))
      return
    }
    const key = contactKey(car, finish)
    if (activeContacts.has(key)) return
    activeContacts.add(key)
    const rule = matchingRule(rules, car, finish)
    if (rule) {
      applyInteractionRule(car, finish, rule)
      if (rule.effect === 'finish' && !finishOrder.includes(car.id)) finishOrder.push(car.id)
    }
    return
  }

  if (!isSolidBody(a) || !isSolidBody(b)) return
  if (!isRaceParticipant(a) && !isRaceParticipant(b)) return

  const manifold = overlapManifold(a, b)
  const key = contactKey(a, b)
  if (!manifold) {
    activeContacts.delete(key)
    return
  }

  const { nx, ny, depth } = manifold
  separateBodies(a, b, nx, ny, depth)

  const closing = closingSpeed(a, b, nx, ny)
  const isNew = !activeContacts.has(key)
  if (isNew) activeContacts.add(key)

  const lastImpulse = impulseAt.get(key) ?? -Infinity
  const cooledDown = elapsed - lastImpulse >= IMPACT_COOLDOWN
  // Impulse + damage once per cooled contact enter (not every separation pass / grind tick).
  if (isNew && cooledDown && !impulseThisFrame.has(key)) {
    impulseThisFrame.add(key)
    collisionEvents.add(key)
    impulseAt.set(key, elapsed)
    applyImpact(a, b, nx, ny, closing)
    fireDamageRules(a, b, rules, closing)
  } else if (!isMovableBody(a) || !isMovableBody(b)) {
    // Continuous scrape into walls / obstacles / parked wrecks.
    if (isMovableBody(a) && !isMovableBody(b)) dampAgainstStatic(a, nx, ny, true)
    else if (isMovableBody(b) && !isMovableBody(a)) dampAgainstStatic(b, nx, ny, false)
  }
}

/** Separate overlapping solids, bounce speeds, and fire enter-contact rules. */
export function resolvePhysics(
  entities: Entity[],
  rules: CreatiBoxProject['world']['rules'],
  activeContacts: Set<string>,
  collisionEvents: Set<string>,
  impulseAt: Map<string, number>,
  elapsed: number,
  path: Vec2[],
  finishOrder: string[],
) {
  const impulseThisFrame = new Set<string>()
  const priorFinishCount = finishOrder.length
  // A few iterations clear stacked car piles in one frame.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        resolvePair(
          entities[i]!,
          entities[j]!,
          rules,
          activeContacts,
          collisionEvents,
          impulseAt,
          elapsed,
          finishOrder,
          path,
          impulseThisFrame,
        )
      }
    }
  }
  const arrived = finishOrder.splice(priorFinishCount).sort()
  finishOrder.push(...arrived)
}

/** Stable progress order; unfinished entries never acquire a final place. */
export function raceStandings(run: WorldRuntime) {
  const path = run.project.world.trackPath!
  const progress = (entity: Entity) => {
    const i = Math.min(entity.waypointIndex ?? 1, path.length - 1)
    const a = path[i - 1], b = path[i]
    const dx = b.x - a.x, dy = b.y - a.y
    const projection = ((entity.position.x - a.x) * dx + (entity.position.y - a.y) * dy) / (dx * dx + dy * dy || 1)
    return i - 1 + Math.max(0, Math.min(1, projection))
  }
  return [...run.participants].sort((a, b) => {
    const ai = run.finishOrder.indexOf(a.id), bi = run.finishOrder.indexOf(b.id)
    if (ai >= 0 || bi >= 0) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi)
    return progress(b) - progress(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  })
}
