import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { createRaceProject, type RacePresetOptions } from '../model/raceGenerator'
import { WorldRuntime } from './worldRuntime'
import { cloneData } from '../model/clone'

const defaults: RacePresetOptions = { track: 'straight', length: 1, carShape: 'sport', color: 'red', motion: 'dynamic', sound: 'sport', opponents: 3, difficulty: 'normal' }
const idle = new Set<string>()
function advance(run: WorldRuntime, seconds: number, keys = idle) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) run.step(1 / 60, keys)
}

describe('world run lifecycle', () => {
  it('clones reactive authoring data, freezes everyone for 3 seconds, then starts', () => {
    const source = reactive(createRaceProject(defaults))
    const saved = cloneData(source)
    const run = new WorldRuntime(source)
    advance(run, 2.9, new Set([' ']))
    expect(run.phase).toBe('countdown')
    expect(run.cars.map(c => c.position)).toEqual(saved.world.entities.filter(e => e.kind === 'car').map(c => c.position))
    expect(run.cars.every(c => c.speed === 0)).toBe(true)
    advance(run, 1, new Set([' ']))
    expect(run.phase).toBe('racing')
    expect(run.cars.every(c => c.speed > 0)).toBe(true)
    expect(source).toEqual(saved)
  })

  it('drives to the finish and creates a fresh race on restart', () => {
    const source = createRaceProject(defaults)
    const run = new WorldRuntime(source)
    advance(run, 25, new Set(['arrowup']))
    expect(run.phase).toBe('finished')
    expect(run.player.state).toBe('Finished')
    expect(run.finishOrder).toContain(run.player.id)
    expect(run.cars.every(c => c.speed === 0)).toBe(true)
    const restarted = new WorldRuntime(source)
    expect(restarted.project).not.toBe(run.project)
    expect(restarted.player.position).toEqual(source.world.entities[0].position)
    expect(restarted.countdown).toBe(3)
    expect(restarted.elapsed).toBe(0)
    expect(restarted.contacts.size).toBe(0)
    expect(restarted.finishOrder).toEqual([])
  })

  it('supports steering, Space acceleration and braking', () => {
    const run = new WorldRuntime(createRaceProject(defaults))
    advance(run, 3.1)
    advance(run, 0.5, new Set([' ']))
    expect(run.player.speed).toBeGreaterThan(90)
    advance(run, 0.2, new Set(['arrowright','arrowup']))
    expect(run.player.rotation).toBeGreaterThan(0)
    const angle = run.player.rotation
    advance(run, 0.2, new Set(['arrowleft','arrowup']))
    expect(run.player.rotation).toBeLessThan(angle)
    advance(run, 1, new Set(['arrowdown']))
    expect(run.player.speed).toBe(0)
  })

  it('does not finish a circuit at its shared start/finish', () => {
    const run = new WorldRuntime(createRaceProject({ ...defaults, track: 'circuit' }))
    advance(run, 8)
    expect(run.player.state).toBe('Idle')
    expect(run.phase).toBe('racing')
  })

  it('rejects missing player, invalid path and missing finish with actionable errors', () => {
    const noPlayer = createRaceProject(defaults)
    noPlayer.world.entities = noPlayer.world.entities.filter(e => e.controlRole !== 'player')
    expect(() => new WorldRuntime(noPlayer)).toThrow('缺少玩家车')
    const noPath = createRaceProject(defaults)
    delete noPath.world.trackPath
    expect(() => new WorldRuntime(noPath)).toThrow('trackPath')
    const noFinish = createRaceProject(defaults)
    noFinish.world.entities = noFinish.world.entities.filter(e => e.kind !== 'finish')
    expect(() => new WorldRuntime(noFinish)).toThrow('缺少终点')
  })

  it('ends a broken player run and preserves designed durability on restart', () => {
    const source = createRaceProject(defaults)
    source.world.entities[0].durability = 55
    const run = new WorldRuntime(source)
    advance(run, 3.1)
    run.player.state = 'Broken'
    run.player.durability = 0
    advance(run, 1)
    expect(run.phase).toBe('finished')
    expect(new WorldRuntime(source).player.durability).toBe(55)
  })
})

for (const track of ['straight', 'curve', 'circuit'] as const) {
  for (const length of [1, 2] as const) {
    for (const difficulty of ['easy', 'normal', 'fast'] as const) {
      it(`all 3 CPU cars finish ${track} ${length}km ${difficulty}`, () => {
        const run = new WorldRuntime(createRaceProject({ ...defaults, track, length, difficulty }))
        advance(run, 150)
        const cpu = run.cars.filter(c => c.controlRole === 'computer')
        expect(cpu.map(c => ({ name: c.name, state: c.state, waypoint: c.waypointIndex }))).toEqual(cpu.map(c => ({ name: c.name, state: 'Finished', waypoint: run.project.world.trackPath!.length - 1 })))
        expect(run.player.state).toBe('Idle')
      })
    }
  }
}
