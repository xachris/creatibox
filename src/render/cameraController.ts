import type { Container } from 'pixi.js'
import type { CameraFrame, CameraStrategy, ViewState } from './viewState'

/** Applies display transforms only. Runtime and Entity coordinates remain authoritative. */
export class CameraController {
  constructor(private readonly worldLayer: Container) {}

  update(frame: CameraFrame, viewState: Readonly<ViewState>, strategy: Readonly<CameraStrategy> = {}): void {
    if (viewState.followMode !== 'participant' || !frame.target) {
      return
    }
    const zoom = Number.isFinite(viewState.zoom) && viewState.zoom > 0 ? viewState.zoom : 1
    this.worldLayer.scale.set(zoom)
    this.worldLayer.rotation = viewState.rotation
    const desiredX = frame.viewport.width / 2 - frame.target.x * zoom
    const desiredY = frame.viewport.height / 2 - frame.target.y * zoom
    const targetScreenX = frame.target.x * zoom + this.worldLayer.position.x
    const targetScreenY = frame.target.y * zoom + this.worldLayer.position.y
    const deadZone = Math.max(0, Math.min(0.8, strategy.deadZoneRatio ?? 0))
    const halfWidth = frame.viewport.width * deadZone / 2
    const halfHeight = frame.viewport.height * deadZone / 2
    if (Math.abs(targetScreenX - frame.viewport.width / 2) <= halfWidth
      && Math.abs(targetScreenY - frame.viewport.height / 2) <= halfHeight) return
    const smoothing = Math.max(0, Math.min(1, strategy.smoothing ?? 1))
    this.worldLayer.position.set(
      this.worldLayer.position.x + (desiredX - this.worldLayer.position.x) * smoothing,
      this.worldLayer.position.y + (desiredY - this.worldLayer.position.y) * smoothing,
    )
  }

  reset(): void {
    this.worldLayer.position.set(0, 0)
    this.worldLayer.scale.set(1)
    this.worldLayer.rotation = 0
  }
}
