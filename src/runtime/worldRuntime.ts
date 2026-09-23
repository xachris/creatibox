import type { CreatiBoxProject, Entity, Vec2 } from '../model/types'
import { cloneData } from '../model/clone'
import { applyInteractionRule, intersects, matchingRule } from './rules'

export type RunPhase = 'countdown' | 'racing' | 'finished'

/** An isolated run of the shared world model; all interactions use world rules. */
export class WorldRuntime {
  readonly project: CreatiBoxProject
  readonly player: Entity
  readonly cars: Entity[]
  readonly contacts = new Set<string>()
  readonly finishOrder: string[] = []
  phase: RunPhase = 'countdown'
  countdown = 3
  elapsed = 0

  constructor(source: CreatiBoxProject) {
    this.project = cloneData(source)
    const world = this.project.world
    const player = world.entities.find(e => e.kind === 'car' && e.controlRole !== 'computer')
    if (!player) throw new Error('缺少玩家车。请进入编辑，将一辆赛车的控制角色设为玩家控制。')
    if (!world.trackPath || world.trackPath.length < 2 || world.trackPath.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)) || world.trackPath.every(p => p.x === world.trackPath![0].x && p.y === world.trackPath![0].y)) {
      throw new Error('缺少有效赛道路径（trackPath）。请进入编辑，使用“快速比赛”生成赛道。')
    }
    if (!world.entities.some(e => e.kind === 'finish') || !world.rules.some(r => r.sourceKind === 'car' && r.targetKind === 'finish' && r.interaction === 'reach' && r.effect === 'finish')) {
      throw new Error('缺少终点或完赛规则。请进入编辑，使用“快速比赛”重新生成完整赛道。')
    }
    this.player = player
    this.cars = world.entities.filter(e => e.kind === 'car')
    for (const car of this.cars) {
      car.speed = 0
      car.state = car.durability <= 0 ? 'Broken' : 'Idle'
      car.waypointIndex = 1
    }
  }

  step(seconds: number, keys: ReadonlySet<string>) {
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
    for (const car of this.cars) {
      if (car.state === 'Finished' || car.state === 'Broken') continue
      if (car.controlRole === 'computer') updateComputerCar(car, path, dt)
      else updatePlayerCar(car, dt, keys)
      const index = car.waypointIndex ?? 1
      if (index < path.length - 1 && Math.hypot(path[index].x - car.position.x, path[index].y - car.position.y) < 110) {
        car.waypointIndex = index + 1
      }
      processCollisions(car, world.entities, world.rules, this.contacts, path)
      if (car.state as string === 'Finished') this.finishOrder.push(car.id)
    }
    if (this.player.state === 'Finished' || this.player.state === 'Broken') {
      this.phase = 'finished'
      for (const car of this.cars) car.speed = 0
    }
  }
}

function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
}

function updateComputerCar(car: Entity, path: Vec2[], dt: number) {
  if (path.length < 2 || car.state === 'Finished' || car.state === 'Broken') return
  const index = Math.min(car.waypointIndex ?? 1, path.length - 1)
  const target = path[index]
  const dx = target.x - car.position.x
  const dy = target.y - car.position.y

  const desired = Math.atan2(dy, dx)
  const delta = normalizeAngle(desired - car.rotation)
  const turnRate = car.opponentProfile === 'easy' ? 1.65 : car.opponentProfile === 'fast' ? 2.65 : 2.15
  car.rotation += Math.max(-turnRate * dt, Math.min(turnRate * dt, delta))

  const acceleration = car.opponentProfile === 'easy' ? 105 : car.opponentProfile === 'fast' ? 155 : 130
  // Slow before sharp bends so every profile can stay near the waypoint path.
  const limit = Math.min(car.maxSpeed, Math.abs(delta) > 0.35 ? 100 : car.maxSpeed)
  car.speed = Math.max(0, Math.min(limit, car.speed + acceleration * dt))
  car.position.x += Math.cos(car.rotation) * car.speed * dt
  car.position.y += Math.sin(car.rotation) * car.speed * dt
  car.state = 'Moving'


}

function updatePlayerCar(car: Entity, dt: number, keys: ReadonlySet<string>) {
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

  if (forward || primary) car.speed = Math.min(car.maxSpeed, car.speed + (primary ? 210 : 165) * dt)
  else car.speed = Math.max(0, car.speed - 60 * dt)

  if (braking) car.speed = Math.max(0, car.speed - 250 * dt)

  const turn = (right ? 1 : 0) - (left ? 1 : 0)
  car.rotation += turn * 2.4 * dt * Math.max(0.25, car.speed / Math.max(car.maxSpeed, 1))

  if (car.speed > 0) {
    car.state = 'Moving'
    car.position.x += Math.cos(car.rotation) * car.speed * dt
    car.position.y += Math.sin(car.rotation) * car.speed * dt
  } else if (car.state === 'Moving') {
    car.state = 'Idle'
  }
}

function processCollisions(car: Entity, worldEntities: Entity[], rules: CreatiBoxProject['world']['rules'], activeContacts: Set<string>, path: Vec2[]) {
  for (const target of worldEntities) {
    if (target.id === car.id || target.kind === 'road' || target.kind === 'start' || target.kind === 'tree') continue
    if (target.kind === 'finish' && (car.waypointIndex ?? 1) < path.length - 1) continue
    const key = `${car.id}:${target.id}`
    const touching = intersects(car, target)
    if (touching && !activeContacts.has(key)) {
      activeContacts.add(key)
      const rule = matchingRule(rules, car, target)
      if (rule) applyInteractionRule(car, target, rule)
      if (target.kind !== 'finish' && target.kind !== 'car') {
        car.speed *= 0.42
        car.position.x -= Math.cos(car.rotation) * 12
        car.position.y -= Math.sin(car.rotation) * 12
      }
    } else if (!touching) {
      activeContacts.delete(key)
    }
  }
}

