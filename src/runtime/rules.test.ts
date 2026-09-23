import { describe, expect, it } from 'vitest'
import { createEntity } from '../model/factory'
import { applyInteractionRule, intersects } from './rules'

describe('world rules', () => {
  it('detects axis-aligned overlap', () => {
    const car = createEntity('car', 100, 100)
    const wall = createEntity('wall', 130, 100)
    expect(intersects(car, wall)).toBe(true)
  })

  it('applies damage and updates state', () => {
    const car = createEntity('car')
    const wall = createEntity('wall')
    applyInteractionRule(car, wall, {
      id: 'rule',
      sourceKind: 'car',
      interaction: 'collide',
      targetKind: 'wall',
      effect: 'damage',
      value: 25,
    })
    expect(car.durability).toBe(75)
    expect(car.state).toBe('Damaged')
  })
})

it('detects a rotated finish gate across the road, without early horizontal hits', () => {
  const finish = createEntity('finish', 100, 100)
  finish.rotation = Math.PI / 2
  finish.size.x = 170
  expect(intersects(createEntity('car', 100, 165), finish)).toBe(true)
  expect(intersects(createEntity('car', 180, 100), finish)).toBe(false)
})
