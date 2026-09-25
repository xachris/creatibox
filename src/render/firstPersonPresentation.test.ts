import { describe, expect, it } from 'vitest'
import type { Entity } from '../model/types'
import { chooseFirstPersonQuality, firstPersonPartCount, isFirstPersonStaticKind, isWithinFirstPersonRange } from './firstPersonPresentation'

function entity(index: number): Entity {
  return {
    id: `entity-${index}`, kind: index % 4 === 0 ? 'tree' : 'obstacle', name: 'pressure',
    position: { x: index * 10, y: 0 }, size: { x: 40, y: 40 }, rotation: 0, color: 0xffffff,
    movable: false, state: 'Idle', durability: 100, maxDurability: 100, speed: 0, maxSpeed: 0,
  }
}

describe('first-person presentation budget', () => {
  it('uses a bounded low-end DPR without changing simulation data', () => {
    expect(chooseFirstPersonQuality(3, 4, 4)).toEqual({ pixelRatio: 1.25, farDistance: 900, tier: 'low' })
    expect(chooseFirstPersonQuality(2, 8, 8)).toEqual({ pixelRatio: 1.75, farDistance: 1400, tier: 'standard' })
  })

  it('gives all four participants distinct composite silhouettes', () => {
    expect(['car', 'horse', 'human', 'sheep'].map(kind => firstPersonPartCount(kind as Entity['kind']))).toEqual([7, 7, 6, 6])
  })

  it('instances only immutable scenery kinds and keeps race markers as entity models', () => {
    expect(['tree', 'wall', 'obstacle'].every(kind => isFirstPersonStaticKind(kind as Entity['kind']))).toBe(true)
    expect(['car', 'horse', 'human', 'sheep', 'start', 'finish', 'road'].some(kind => isFirstPersonStaticKind(kind as Entity['kind']))).toBe(false)
  })

  it('keeps culling a display-only decision around the player position', () => {
    const item = entity(0)
    expect(isWithinFirstPersonRange(item, { ...item.position }, 900)).toBe(true)
    expect(isWithinFirstPersonRange(item, { x: 5000, y: 5000 }, 900)).toBe(false)
  })

  it.each([500, 1000])('culls a %i-entity pressure world by display range only', count => {
    const entities = Array.from({ length: count }, (_, index) => entity(index))
    const before = JSON.stringify(entities)
    const visible = entities.filter(item => isWithinFirstPersonRange(item, { x: 0, y: 0 }, 900))
    expect(visible.length).toBeGreaterThan(0)
    expect(visible.length).toBeLessThan(100)
    expect(JSON.stringify(entities)).toBe(before)
  })
})
