import { describe, expect, it, vi } from 'vitest'
import { Application } from 'pixi.js'
import { CameraController } from './cameraController'
import { createRunViewState, DEFAULT_EDIT_VIEW_STATE } from './viewState'
import { ObliqueRenderer, TopDownRenderer, obliqueDirectionIndex, projectedFootY } from './worldRenderer'

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

    renderer.updateCamera(state, { position: target, rotation: 0, speed: 0 })

    expect(renderer.worldLayer.position).toMatchObject({ x: 150, y: -70 })
    expect(target).toEqual({ x: 350, y: 420 })
    expect(renderer.project(target)).toEqual({ x: 500, y: 350 })
    expect(renderer.unproject({ x: 500, y: 350 })).toEqual(target)
  })

  it('does not follow in edit mode and resets every display transform', () => {
    const app = new Application()
    const renderer = new TopDownRenderer(app)
    renderer.updateCamera(createRunViewState('player'), { position: { x: 350, y: 420 }, rotation: 0, speed: 0 })
    renderer.updateCamera(DEFAULT_EDIT_VIEW_STATE, { position: { x: 900, y: 900 }, rotation: 0, speed: 0 })
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

describe('oblique renderer projection', () => {
  it('projects and inverses ground coordinates without touching world data', () => {
    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    const point = Object.freeze({ x: 100, y: 40 })

    expect(renderer.toLayer(point)).toEqual({ x: 43.199999999999996, y: 50.4 })
    const restored = renderer.unprojectLayer(renderer.toLayer(point))
    expect(restored.x).toBeCloseTo(100, 10)
    expect(restored.y).toBeCloseTo(40, 10)
    expect(point).toEqual({ x: 100, y: 40 })
  })

  it('follows the projected participant and keeps the target centered', () => {
    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    const target = { x: 350, y: 420 }
    renderer.updateCamera(createRunViewState('player', 'oblique'), { position: target, rotation: 0, speed: 0 })
    expect(renderer.project(target).x).toBeCloseTo(500, 10)
    expect(renderer.project(target).y).toBeCloseTo(350, 10)
  })

  it('draws floor markers first and sorts world objects by projected foot point', () => {
    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    const entity = (id: string, kind: 'car' | 'tree' | 'finish', x: number, y: number) => ({
      id, kind, name: id, position: { x, y }, size: { x: 40, y: 40 }, rotation: 0,
      color: 0, movable: false, state: 'Idle' as const, durability: 100, maxDurability: 100,
      speed: 0, maxSpeed: 0,
    })
    const ordered = renderer.orderEntities([
      entity('near', 'tree', 100, 100),
      entity('far', 'car', 20, 20),
      entity('finish', 'finish', 200, 200),
    ])
    expect(ordered.map(item => item.id)).toEqual(['finish', 'far', 'near'])
  })

  it('uses the deepest footprint corner instead of sprite center for depth', () => {
    const long = {
      id: 'long', kind: 'obstacle' as const, name: 'long', position: { x: 50, y: 50 }, size: { x: 200, y: 20 }, rotation: Math.PI / 4,
      color: 0, movable: false, state: 'Idle' as const, durability: 100, maxDurability: 100, speed: 0, maxSpeed: 0,
    }
    const small = { ...long, id: 'small', position: { x: 90, y: 90 }, size: { x: 10, y: 10 }, rotation: 0 }
    expect(projectedFootY(long)).toBeGreaterThan(projectedFootY(small))

    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    expect(renderer.orderEntities([long, small]).map(item => item.id)).toEqual(['small', 'long'])
  })

  it('maps a full turn to eight stable display directions', () => {
    const directions = Array.from({ length: 8 }, (_, index) => obliqueDirectionIndex(index * Math.PI / 4))
    expect(new Set(directions).size).toBe(8)
  })

  it('culls distant objects with a conservative visual margin', () => {
    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    const entity = (id: string, x: number, y: number) => ({
      id, kind: 'tree' as const, name: id, position: { x, y }, size: { x: 40, y: 80 }, rotation: 0,
      color: 0, movable: false, state: 'Idle' as const, durability: 100, maxDurability: 100, speed: 0, maxSpeed: 0,
    })
    expect(renderer.visibleEntities([entity('visible', 100, 100), entity('culled', 10000, 10000)]).map(item => item.id)).toEqual(['visible'])
  })

  it('sorts and culls a 1000 entity pressure set within the display budget', () => {
    const app = new Application()
    const renderer = new ObliqueRenderer(app)
    const entities = Array.from({ length: 1000 }, (_, index) => ({
      id: `tree-${index.toString().padStart(4, '0')}`, kind: 'tree' as const, name: 'Tree',
      position: { x: (index % 40) * 80, y: Math.floor(index / 40) * 80 }, size: { x: 40, y: 80 }, rotation: 0,
      color: 0, movable: false, state: 'Idle' as const, durability: 100, maxDurability: 100, speed: 0, maxSpeed: 0,
    }))
    const started = performance.now()
    for (let index = 0; index < 50; index++) renderer.orderEntities(renderer.visibleEntities(entities))
    expect(performance.now() - started).toBeLessThan(500)
  })
})
