import { Application, Container } from 'pixi.js'
import type { Entity, Vec2 } from '../model/types'
import { CameraController } from './cameraController'
import type { ViewState, Viewport } from './viewState'

export interface IWorldRenderer {
  readonly viewMode: ViewState['viewMode']
  readonly worldLayer: Container
  render(draw: (worldLayer: Container) => void): void
  toLayer(worldPoint: Readonly<Vec2>, elevation?: number): Vec2
  project(worldPoint: Readonly<Vec2>): Vec2
  unproject(screenPoint: Readonly<Vec2>): Vec2
  projectRotation(worldRotation: number): number
  orderEntities(entities: readonly Entity[]): Entity[]
  visibleEntities(entities: readonly Entity[]): Entity[]
  strokeScale(worldWidth: number): number
  updateCamera(viewState: Readonly<ViewState>, target: Readonly<Pick<Entity, 'position' | 'rotation' | 'speed'>> | null, deltaSeconds?: number): void
  resetCamera(): void
  dispose(): void
}

abstract class PixiWorldRenderer implements IWorldRenderer {
  abstract readonly viewMode: ViewState['viewMode']
  readonly worldLayer = new Container()
  protected readonly camera: CameraController

  constructor(protected readonly app: Application) {
    this.camera = new CameraController(this.worldLayer)
    this.app.stage.addChild(this.worldLayer)
  }

  render(draw: (worldLayer: Container) => void): void {
    this.worldLayer.removeChildren().forEach(child => child.destroy())
    draw(this.worldLayer)
  }

  abstract toLayer(worldPoint: Readonly<Vec2>, elevation?: number): Vec2
  abstract unprojectLayer(layerPoint: Readonly<Vec2>): Vec2
  abstract projectRotation(worldRotation: number): number
  abstract orderEntities(entities: readonly Entity[]): Entity[]
  abstract strokeScale(worldWidth: number): number

  project(worldPoint: Readonly<Vec2>): Vec2 {
    const local = this.toLayer(worldPoint)
    const zoom = this.worldLayer.scale.x || 1
    return {
      x: local.x * zoom + this.worldLayer.position.x,
      y: local.y * zoom + this.worldLayer.position.y,
    }
  }

  visibleEntities(entities: readonly Entity[]): Entity[] {
    return [...entities]
  }

  unproject(screenPoint: Readonly<Vec2>): Vec2 {
    const zoom = this.worldLayer.scale.x || 1
    return this.unprojectLayer({
      x: (screenPoint.x - this.worldLayer.position.x) / zoom,
      y: (screenPoint.y - this.worldLayer.position.y) / zoom,
    })
  }

  updateCamera(viewState: Readonly<ViewState>, target: Readonly<Pick<Entity, 'position' | 'rotation' | 'speed'>> | null): void {
    const viewport: Viewport = { width: this.app.screen.width, height: this.app.screen.height }
    this.camera.update({ viewport, target: target ? this.toLayer(target.position) : null }, viewState)
  }

  resetCamera(): void {
    this.camera.reset()
  }

  dispose(): void {
    this.worldLayer.removeChildren().forEach(child => child.destroy())
    this.worldLayer.removeFromParent()
  }
}

/** Phase 1 adapter: preserves the existing Pixi top-down projection exactly. */
export class TopDownRenderer extends PixiWorldRenderer {
  readonly viewMode = 'top-down' as const

  toLayer(worldPoint: Readonly<Vec2>): Vec2 {
    return { x: worldPoint.x, y: worldPoint.y }
  }

  unprojectLayer(layerPoint: Readonly<Vec2>): Vec2 {
    return { x: layerPoint.x, y: layerPoint.y }
  }

  projectRotation(worldRotation: number): number {
    return worldRotation
  }

  orderEntities(entities: readonly Entity[]): Entity[] {
    return [...entities]
  }

  strokeScale(worldWidth: number): number {
    return worldWidth
  }
}

const OBLIQUE_SCALE_X = 0.72
const OBLIQUE_SCALE_Y = 0.36

/** Deepest projected footprint point. Visual height and animation never affect this value. */
export function projectedFootY(entity: Readonly<Entity>): number {
  const halfX = entity.size.x / 2
  const halfY = entity.size.y / 2
  const cos = Math.cos(entity.rotation)
  const sin = Math.sin(entity.rotation)
  let deepest = Number.NEGATIVE_INFINITY
  for (const localX of [-halfX, halfX]) {
    for (const localY of [-halfY, halfY]) {
      const x = entity.position.x + localX * cos - localY * sin
      const y = entity.position.y + localX * sin + localY * cos
      deepest = Math.max(deepest, (x + y) * OBLIQUE_SCALE_Y)
    }
  }
  return deepest
}

export function obliqueDirectionIndex(worldRotation: number): number {
  const x = (Math.cos(worldRotation) - Math.sin(worldRotation)) * OBLIQUE_SCALE_X
  const y = (Math.cos(worldRotation) + Math.sin(worldRotation)) * OBLIQUE_SCALE_Y
  return (Math.round(Math.atan2(y, x) / (Math.PI / 4)) + 8) % 8
}

/** Fixed-heading 2.5D projection. Simulation remains entirely in 2D world coordinates. */
export class ObliqueRenderer extends PixiWorldRenderer {
  readonly viewMode = 'oblique' as const

  toLayer(worldPoint: Readonly<Vec2>, elevation = 0): Vec2 {
    return {
      x: (worldPoint.x - worldPoint.y) * OBLIQUE_SCALE_X,
      y: (worldPoint.x + worldPoint.y) * OBLIQUE_SCALE_Y - elevation,
    }
  }

  unprojectLayer(layerPoint: Readonly<Vec2>): Vec2 {
    return {
      x: 0.5 * (layerPoint.x / OBLIQUE_SCALE_X + layerPoint.y / OBLIQUE_SCALE_Y),
      y: 0.5 * (layerPoint.y / OBLIQUE_SCALE_Y - layerPoint.x / OBLIQUE_SCALE_X),
    }
  }

  projectRotation(worldRotation: number): number {
    const direction = this.toLayer({ x: Math.cos(worldRotation), y: Math.sin(worldRotation) })
    return Math.atan2(direction.y, direction.x)
  }

  orderEntities(entities: readonly Entity[]): Entity[] {
    return entities.map((entity, index) => ({
      entity,
      index,
      layer: entity.kind === 'start' || entity.kind === 'finish' ? 0 : 1,
      footY: projectedFootY(entity),
    })).sort((a, b) => a.layer - b.layer || a.footY - b.footY || a.entity.id.localeCompare(b.entity.id) || a.index - b.index)
      .map(item => item.entity)
  }

  visibleEntities(entities: readonly Entity[]): Entity[] {
    const viewport = { width: this.app.screen.width, height: this.app.screen.height }
    return entities.filter(entity => {
      const point = this.project(entity.position)
      const margin = Math.max(120, entity.size.x * 1.5, entity.size.y * 1.5) * (this.worldLayer.scale.x || 1)
      return point.x >= -margin && point.x <= viewport.width + margin
        && point.y >= -margin && point.y <= viewport.height + margin
    })
  }

  strokeScale(worldWidth: number): number {
    return worldWidth * 0.58
  }

  updateCamera(viewState: Readonly<ViewState>, target: Readonly<Pick<Entity, 'position' | 'rotation' | 'speed'>> | null, deltaSeconds = 0): void {
    const viewport: Viewport = { width: this.app.screen.width, height: this.app.screen.height }
    if (!target) {
      this.camera.update({ viewport, target: null }, viewState)
      return
    }
    const lookAhead = Math.min(Math.max(target.speed, 0) * 0.25, Math.min(viewport.width, viewport.height) * 0.15)
    const focus = {
      x: target.position.x + Math.cos(target.rotation) * lookAhead,
      y: target.position.y + Math.sin(target.rotation) * lookAhead,
    }
    const smoothing = deltaSeconds > 0 ? 1 - Math.exp(-deltaSeconds / 0.15) : 1
    this.camera.update(
      { viewport, target: this.toLayer(focus) },
      viewState,
      { deadZoneRatio: 0.2, smoothing },
    )
  }
}

export function createWorldRenderer(app: Application, viewMode: 'top-down' | 'oblique'): IWorldRenderer {
  return viewMode === 'oblique' ? new ObliqueRenderer(app) : new TopDownRenderer(app)
}
