import { describe, expect, it, vi } from 'vitest'
import { Application } from 'pixi.js'
import { CameraController } from './cameraController'
import { createRunViewState, DEFAULT_EDIT_VIEW_STATE } from './viewState'
import { TopDownRenderer } from './worldRenderer'

vi.mock('pixi.js', () => {
  class Container {
    position = { x: 0, y: 0, set: (x: number, y: number) => { this.position.x = x; this.position.y = y } }
    scale = { x: 1, y: 1, set: (value: number) => { this.scale.x = value; this.scale.y = value } }
    rotation = 0
    children: Array<{ destroy(): void }> = []
    addChild(child: never) { this.children.push(child); return child }
    removeChildren() { return this.children.splice(0) }
    removeFromParent() {}
  }
  class Application {
    stage = new Container()
    screen = { width: 1000, height: 700 }
  }
  return { Application, Container }
})

describe('top-down renderer boundary', () => {
  it('keeps camera state display-only and preserves the current follow transform', () => {
    const app = new Application()
    const renderer = new TopDownRenderer(app)
    const state = createRunViewState('player')
    const target = Object.freeze({ x: 350, y: 420 })

    renderer.updateCamera(state, target)

    expect(renderer.worldLayer.position).toMatchObject({ x: 150, y: -70 })
    expect(target).toEqual({ x: 350, y: 420 })
    expect(renderer.project(target)).toEqual({ x: 500, y: 350 })
    expect(renderer.unproject({ x: 500, y: 350 })).toEqual(target)
  })

  it('does not follow in edit mode and resets every display transform', () => {
    const app = new Application()
    const renderer = new TopDownRenderer(app)
    renderer.updateCamera(createRunViewState('player'), { x: 350, y: 420 })
    renderer.updateCamera(DEFAULT_EDIT_VIEW_STATE, { x: 900, y: 900 })
    expect(renderer.worldLayer.position).toMatchObject({ x: 150, y: -70 })

    renderer.resetCamera()
    expect(renderer.worldLayer.position).toMatchObject({ x: 0, y: 0 })
    expect(renderer.worldLayer.scale).toMatchObject({ x: 1, y: 1 })
    expect(renderer.worldLayer.rotation).toBe(0)
  })

  it('cleans old visual children without owning runtime state', () => {
    const layer = new (class {
      position = { set() {} }
      scale = { set() {} }
      rotation = 0
    })() as never
    const controller = new CameraController(layer)
    expect(() => controller.reset()).not.toThrow()

    const app = new Application()
    const renderer = new TopDownRenderer(app)
    const destroy = vi.fn()
    renderer.render(worldLayer => { worldLayer.addChild({ destroy } as never) })
    renderer.render(() => {})
    expect(destroy).toHaveBeenCalledOnce()
  })
})
