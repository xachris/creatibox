import { Application, Container } from 'pixi.js'
import type { Vec2 } from '../model/types'
import { CameraController } from './cameraController'
import type { ViewState, Viewport } from './viewState'

export interface IWorldRenderer {
  readonly viewMode: ViewState['viewMode']
  readonly worldLayer: Container
  render(draw: (worldLayer: Container) => void): void
  project(worldPoint: Readonly<Vec2>): Vec2
  unproject(screenPoint: Readonly<Vec2>): Vec2
  updateCamera(viewState: Readonly<ViewState>, target: Readonly<Vec2> | null): void
  resetCamera(): void
  dispose(): void
}

/** Phase 1 adapter: preserves the existing Pixi top-down projection exactly. */
export class TopDownRenderer implements IWorldRenderer {
  readonly viewMode = 'top-down' as const
  readonly worldLayer = new Container()
  private readonly camera: CameraController

  constructor(private readonly app: Application) {
    this.camera = new CameraController(this.worldLayer)
    this.app.stage.addChild(this.worldLayer)
  }

  render(draw: (worldLayer: Container) => void): void {
    this.worldLayer.removeChildren().forEach(child => child.destroy())
    draw(this.worldLayer)
  }

  project(worldPoint: Readonly<Vec2>): Vec2 {
    const zoom = this.worldLayer.scale.x || 1
    return {
      x: worldPoint.x * zoom + this.worldLayer.position.x,
      y: worldPoint.y * zoom + this.worldLayer.position.y,
    }
  }

  unproject(screenPoint: Readonly<Vec2>): Vec2 {
    const zoom = this.worldLayer.scale.x || 1
    return {
      x: (screenPoint.x - this.worldLayer.position.x) / zoom,
      y: (screenPoint.y - this.worldLayer.position.y) / zoom,
    }
  }

  updateCamera(viewState: Readonly<ViewState>, target: Readonly<Vec2> | null): void {
    const viewport: Viewport = { width: this.app.screen.width, height: this.app.screen.height }
    this.camera.update({ viewport, target }, viewState)
  }

  resetCamera(): void {
    this.camera.reset()
  }

  dispose(): void {
    this.worldLayer.removeChildren().forEach(child => child.destroy())
    this.worldLayer.removeFromParent()
  }
}
