import type { Entity, Rule } from '../model/types'

export function intersects(a: Entity, b: Entity): boolean {
  return !(
    a.position.x + a.size.x / 2 < b.position.x - b.size.x / 2 ||
    a.position.x - a.size.x / 2 > b.position.x + b.size.x / 2 ||
    a.position.y + a.size.y / 2 < b.position.y - b.size.y / 2 ||
    a.position.y - a.size.y / 2 > b.position.y + b.size.y / 2
  )
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
