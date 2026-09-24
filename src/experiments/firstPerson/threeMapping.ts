import type { Entity } from '../../model/types'

export interface ThreeTransform {
  position: { x: number; y: number; z: number }
  rotationY: number
  scale: { x: number; y: number; z: number }
}

/** Read-only adapter: world (x,y) becomes Three (x,height,z). */
export function toThreeTransform(entity: Readonly<Entity>): ThreeTransform {
  const displayHeight = entity.kind === 'tree' ? Math.max(24, entity.size.y) : Math.max(6, entity.size.y * 0.45)
  return {
    position: { x: entity.position.x, y: displayHeight / 2, z: entity.position.y },
    rotationY: -entity.rotation,
    scale: { x: entity.size.x, y: displayHeight, z: entity.size.y },
  }
}

export function firstPersonCameraFrame(entity: Readonly<Pick<Entity, 'position' | 'rotation'>>, eyeHeight = 18) {
  return {
    position: { x: entity.position.x, y: eyeHeight, z: entity.position.y },
    target: {
      x: entity.position.x + Math.cos(entity.rotation) * 100,
      y: eyeHeight,
      z: entity.position.y + Math.sin(entity.rotation) * 100,
    },
  }
}
