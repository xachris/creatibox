import type { Container } from 'pixi.js'
import type { CameraFrame, ViewState } from './viewState'

/** Applies display transforms only. Runtime and Entity coordinates remain authoritative. */
export class CameraController {
  constructor(private readonly worldLayer: Container) {}

  update(frame: CameraFrame, viewState: Readonly<ViewState>): void {
    if (viewState.viewMode !== 'top-down' || viewState.followMode !== 'participant' || !frame.target) {
      return
    }
    const zoom = Number.isFinite(viewState.zoom) && viewState.zoom > 0 ? viewState.zoom : 1
    this.worldLayer.scale.set(zoom)
    this.worldLayer.rotation = viewState.rotation
    this.worldLayer.position.set(
      frame.viewport.width / 2 - frame.target.x * zoom,
      frame.viewport.height / 2 - frame.target.y * zoom,
    )
  }

  reset(): void {
    this.worldLayer.position.set(0, 0)
    this.worldLayer.scale.set(1)
    this.worldLayer.rotation = 0
  }
}
