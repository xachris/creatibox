import { describe, expect, it } from 'vitest'
import { createRaceProject } from '../../model/raceGenerator'
import { WorldRuntime } from '../../runtime/worldRuntime'
import { castCorridorView, castGridRay } from './raycastCorridor'
import { firstPersonCameraFrame, toThreeTransform } from './threeMapping'

describe('first-person architecture spike', () => {
  it('raycasts a restricted grid corridor with corrected view distances', () => {
    const grid = [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ]
    expect(castGridRay(grid, { x: 2.5, y: 2 }, 0)).toMatchObject({ cellX: 4, cellY: 2, distance: 1.5 })
    expect(castCorridorView(grid, { x: 2.5, y: 2 }, 0, 5)).toHaveLength(5)
  })

  it('maps the same runtime entities without mutating world coordinates', () => {
    const source = createRaceProject({ track: 'curve', length: 1, carShape: 'classic', color: 'red', motion: 'clean', sound: 'light', opponents: 2, difficulty: 'normal' })
    const runtime = new WorldRuntime(source)
    const before = JSON.stringify(runtime.project.world)
    const transform = toThreeTransform(runtime.player)
    const camera = firstPersonCameraFrame(runtime.player)

    expect(transform.position.x).toBe(runtime.player.position.x)
    expect(transform.position.z).toBe(runtime.player.position.y)
    expect(camera.target.x).toBeGreaterThan(camera.position.x)
    expect(JSON.stringify(runtime.project.world)).toBe(before)
  })

  it('keeps simulation traces identical when display adapters are sampled every tick', () => {
    const source = createRaceProject({ track: 'straight', length: 1, carShape: 'sport', color: 'blue', motion: 'dynamic', sound: 'electric', opponents: 3, difficulty: 'fast' })
    const baseline = new WorldRuntime(source)
    const observed = new WorldRuntime(source)
    for (let index = 0; index < 900; index++) {
      baseline.step(1 / 60, new Set())
      observed.step(1 / 60, new Set())
      for (const entity of observed.project.world.entities) toThreeTransform(entity)
      firstPersonCameraFrame(observed.player)
    }
    expect(observed.project).toEqual(baseline.project)
    expect(observed.finishOrder).toEqual(baseline.finishOrder)
    expect(observed.elapsed).toBe(baseline.elapsed)
  })
})
