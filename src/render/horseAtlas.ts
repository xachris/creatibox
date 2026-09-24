import { Assets, Rectangle, Sprite, Texture } from 'pixi.js'
import type { Entity } from '../model/types'
import { obliqueDirectionIndex } from './worldRenderer'

const ATLAS_URL = '/assets/participants/horse/horse-brown-v1.png'
const CELL_SIZE = 320
const DISPLAY_SIZE = 132

type AuthoredDirection = 'frontRight' | 'right' | 'backRight' | 'back'

export interface HorseFrameSelection {
  direction: AuthoredDirection
  column: number
  mirrored: boolean
  key: string
}

let sourceTexture: Texture | null = null
let loading: Promise<boolean> | null = null
const frameTextures = new Map<string, Texture>()

/** Maps eight projected headings onto four authored rows plus horizontal mirrors. */
export function selectHorseFrame(entity: Readonly<Pick<Entity, 'rotation' | 'speed' | 'state'>>, distance: number): HorseFrameSelection {
  const index = obliqueDirectionIndex(entity.rotation)
  const directionMap: Array<[AuthoredDirection, boolean]> = [
    ['right', false],
    ['frontRight', false],
    ['frontRight', false],
    ['frontRight', true],
    ['right', true],
    ['backRight', true],
    ['back', false],
    ['backRight', false],
  ]
  const [direction, mirrored] = directionMap[index]
  const moving = entity.speed > 1 && entity.state !== 'Finished' && entity.state !== 'Broken'
  const column = moving ? 1 + (Math.floor(Math.max(0, distance) / 18) % 4) : 0
  return { direction, column, mirrored, key: `${direction}:${column}` }
}

export async function preloadHorseAtlas(): Promise<boolean> {
  if (sourceTexture) return true
  if (!loading) {
    loading = Assets.load<Texture>(ATLAS_URL)
      .then(texture => {
        sourceTexture = texture
        return true
      })
      .catch(() => false)
  }
  return loading
}

function textureFor(selection: HorseFrameSelection): Texture | null {
  if (!sourceTexture) return null
  const cached = frameTextures.get(selection.key)
  if (cached) return cached
  const rows: Record<AuthoredDirection, number> = { frontRight: 0, right: 1, backRight: 2, back: 3 }
  const texture = new Texture({
    source: sourceTexture.source,
    frame: new Rectangle(selection.column * CELL_SIZE, rows[selection.direction] * CELL_SIZE, CELL_SIZE, CELL_SIZE),
  })
  frameTextures.set(selection.key, texture)
  return texture
}

/** Returns null until the atlas is ready so callers can retain the vector fallback. */
export function createObliqueHorseSprite(entity: Entity, distance: number): Sprite | null {
  const selection = selectHorseFrame(entity, distance)
  const texture = textureFor(selection)
  if (!texture) return null
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 0.94)
  sprite.width = DISPLAY_SIZE
  sprite.height = DISPLAY_SIZE
  if (selection.mirrored) sprite.scale.x = -Math.abs(sprite.scale.x)
  sprite.alpha = entity.state === 'Broken' ? 0.42 : 1
  return sprite
}
