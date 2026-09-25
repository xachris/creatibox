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

export function isFirstPersonStaticKind(kind: EntityKind): boolean {
  return kind === 'tree' || kind === 'wall' || kind === 'obstacle'
}

export function isWithinFirstPersonRange(entity: Readonly<Entity>, camera: Readonly<Vec2>, farDistance: number): boolean {
  const radius = Math.max(entity.size.x, entity.size.y) / 2
  const dx = entity.position.x - camera.x
  const dy = entity.position.y - camera.y
  return dx * dx + dy * dy <= (farDistance + radius) ** 2
}

export interface FirstPersonHorseFrame {
  row: 0 | 1 | 2 | 3
  column: 0 | 1 | 2 | 3 | 4
  mirrored: boolean
}

/** Selects a billboard frame from the four-direction Horse Brown V1 atlas. */
export function firstPersonHorseFrame(
  entity: Readonly<Pick<Entity, 'position' | 'rotation' | 'speed' | 'state'>>,
  camera: Readonly<Vec2>,
  animationTimeMs: number,
): FirstPersonHorseFrame {
  const cameraHeading = Math.atan2(camera.y - entity.position.y, camera.x - entity.position.x)
  const relative = Math.atan2(Math.sin(entity.rotation - cameraHeading), Math.cos(entity.rotation - cameraHeading))
  const angle = Math.abs(relative)
  const row: FirstPersonHorseFrame['row'] = angle < Math.PI * .375 ? 0 : angle < Math.PI * .625 ? 1 : angle < Math.PI * .875 ? 2 : 3
  const moving = entity.speed > 1 && entity.state !== 'Finished' && entity.state !== 'Broken'
  const column = moving ? (1 + Math.floor(Math.max(0, animationTimeMs) / 110) % 4) as 1 | 2 | 3 | 4 : 0
  return { row, column, mirrored: relative < 0 }
}
