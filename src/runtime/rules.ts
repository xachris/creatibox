import { isRaceParticipant } from '../model/race'
import type { Entity, Rule } from '../model/types'

function projectionRadius(entity: Entity, angle: number) {
  return (
    Math.abs(Math.cos(entity.rotation - angle)) * entity.size.x / 2
    + Math.abs(Math.sin(entity.rotation - angle)) * entity.size.y / 2
  )
}

export function intersects(a: Entity, b: Entity): boolean {
  // Separating-axis test for rotated rectangles, including the finish gate.
  const axes = [a.rotation, a.rotation + Math.PI / 2, b.rotation, b.rotation + Math.PI / 2]
  return axes.every(angle => {
    const distance = Math.abs(
      (b.position.x - a.position.x) * Math.cos(angle)
      + (b.position.y - a.position.y) * Math.sin(angle),
    )
    return distance <= projectionRadius(a, angle) + projectionRadius(b, angle)
  })
}

/** Minimum translation vector: normal points from A toward B. */
export function overlapManifold(a: Entity, b: Entity): { nx: number; ny: number; depth: number } | null {
  const axes = [a.rotation, a.rotation + Math.PI / 2, b.rotation, b.rotation + Math.PI / 2]
  let minDepth = Infinity
  let nx = 1
  let ny = 0

  for (const angle of axes) {
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)
    const distance = (b.position.x - a.position.x) * ca + (b.position.y - a.position.y) * sa
    const depth = projectionRadius(a, angle) + projectionRadius(b, angle) - Math.abs(distance)
    if (depth < 0) return null
    if (depth < minDepth) {
      minDepth = depth
      const sign = distance >= 0 ? 1 : -1
      nx = ca * sign
      ny = sa * sign
    }
  }

  if (!Number.isFinite(minDepth) || minDepth <= 0) return null
  return { nx, ny, depth: minDepth }
}

export function applyInteractionRule(source: Entity, target: Entity, rule: Rule): void {
  if (rule.effect === 'damage') {
    const damage = Math.max(0, rule.value ?? 0)
    source.durability = Math.max(0, source.durability - damage)
    source.state = source.durability <= 0 ? 'Broken' : 'Damaged'
    if (target.maxDurability < 9999) {
      target.durability = Math.max(0, target.durability - Math.ceil(damage / 2))
      target.state = target.durability <= 0 ? 'Broken' : 'Damaged'
    }
  }

  if (rule.effect === 'finish') {
    source.speed = 0
    source.state = 'Finished'
  }
}

export function matchingRule(rules: Rule[], source: Entity, target: Entity): Rule | undefined {
  return rules.find((rule) =>
    (rule.sourceCapability === 'race' ? !rule.sourceKind && isRaceParticipant(source) : rule.sourceKind === source.kind)
    && (rule.targetCapability === 'race' ? !rule.targetKind && isRaceParticipant(target) : rule.targetKind === target.kind)
    && ((rule.interaction === 'collide' && target.kind !== 'finish')
      || (rule.interaction === 'reach' && target.kind === 'finish')),
  )
}

export function isSolidBody(entity: Entity): boolean {
  // Finish is a trigger; finished cars ghost so others can still cross the line.
  // Trees / road / start are decorative. Broken wrecks stay solid.
  if (entity.state === 'Finished') return false
  return (['car', 'horse', 'human', 'sheep'].includes(entity.kind) || isRaceParticipant(entity)) || entity.kind === 'wall' || entity.kind === 'obstacle'
}

/** Self-propelled bodies that carry arcade velocity. */
export function isMovableBody(entity: Entity): boolean {
  return (['car', 'horse', 'human', 'sheep'].includes(entity.kind) || isRaceParticipant(entity)) && entity.state !== 'Broken' && entity.state !== 'Finished'
}

/** Bodies that can be nudged by separation (includes wrecks). */
export function isShovableBody(entity: Entity): boolean {
  return (['car', 'horse', 'human', 'sheep'].includes(entity.kind) || isRaceParticipant(entity)) && entity.state !== 'Finished'
}

/** Closing speed along contact normal (positive = approaching). */
export function closingSpeed(a: Entity, b: Entity, nx: number, ny: number): number {
  const va = isMovableBody(a)
    ? { x: Math.cos(a.rotation) * a.speed, y: Math.sin(a.rotation) * a.speed }
    : { x: 0, y: 0 }
  const vb = isMovableBody(b)
    ? { x: Math.cos(b.rotation) * b.speed, y: Math.sin(b.rotation) * b.speed }
    : { x: 0, y: 0 }
  return (va.x - vb.x) * nx + (va.y - vb.y) * ny
}
