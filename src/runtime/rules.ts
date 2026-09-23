import type { Entity, Rule } from '../model/types'

export function intersects(a: Entity, b: Entity): boolean {
  // Separating-axis test for rotated rectangles, including the finish gate.
  const axes = [a.rotation, a.rotation + Math.PI / 2, b.rotation, b.rotation + Math.PI / 2]
  const radius = (entity: Entity, angle: number) =>
    Math.abs(Math.cos(entity.rotation - angle)) * entity.size.x / 2 +
    Math.abs(Math.sin(entity.rotation - angle)) * entity.size.y / 2
  return axes.every(angle => {
    const distance = Math.abs((b.position.x - a.position.x) * Math.cos(angle) + (b.position.y - a.position.y) * Math.sin(angle))
    return distance <= radius(a, angle) + radius(b, angle)
  })
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
    rule.sourceKind === source.kind &&
    rule.targetKind === target.kind &&
    ((rule.interaction === 'collide' && target.kind !== 'finish') ||
      (rule.interaction === 'reach' && target.kind === 'finish'))
  )
}
