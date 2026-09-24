import type { Entity, EntityKind, Vec2 } from '../model/types'

export interface FirstPersonQuality {
  pixelRatio: number
  farDistance: number
  tier: 'low' | 'standard'
}

export function chooseFirstPersonQuality(devicePixelRatio: number, hardwareConcurrency = 8, deviceMemory = 8): FirstPersonQuality {
  const low = hardwareConcurrency <= 4 || deviceMemory <= 4
  return {
    pixelRatio: Math.min(Math.max(devicePixelRatio, 1), low ? 1.25 : 1.75),
    farDistance: low ? 900 : 1400,
    tier: low ? 'low' : 'standard',
  }
}

export function firstPersonPartCount(kind: EntityKind): number {
  return ({ car: 7, horse: 7, human: 6, sheep: 6, tree: 2 } as Partial<Record<EntityKind, number>>)[kind] ?? 1
}

export function isWithinFirstPersonRange(entity: Readonly<Entity>, camera: Readonly<Vec2>, farDistance: number): boolean {
  const radius = Math.max(entity.size.x, entity.size.y) / 2
  const dx = entity.position.x - camera.x
  const dy = entity.position.y - camera.y
  return dx * dx + dy * dy <= (farDistance + radius) ** 2
}
