// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import WorldCanvas from './WorldCanvas.vue'
import { createRaceProject } from '../model/raceGenerator'

const pixi = vi.hoisted(() => ({ tick: (_: { deltaMS: number }) => {}, camera: { x: 0, y: 0 } }))
vi.mock('howler', () => {
  class Howl {
    play() { return 1 }
    stop() {}
    unload() {}
    volume() { return this }
    rate() { return this }
    playing() { return false }
    once(_e: string, cb: () => void) { cb(); return this }
  }
  return { Howl, Howler: { mute() {}, volume() {} } }
})
vi.mock('pixi.js', () => {
  class Container {
    position = { x: 0, y: 0, set: (x: number, y: number) => { this.position.x = x; this.position.y = y; if (this.constructor === Container) pixi.camera = { x, y } } }
    addChild() {}
    removeChildren() { return [] }
    on() {}
  }
  class Graphics extends Container {
    rect() { return this } roundRect() { return this } circle() { return this }
    fill() { return this } stroke() { return this } moveTo() { return this }
    lineTo() { return this } poly() { return this }
  }
  return { Container, Graphics, Application: class {
    canvas = document.createElement('canvas')
    stage = new Container()
    screen = { width: 1000, height: 700 }
    ticker = { add: (callback: typeof pixi.tick) => { pixi.tick = callback } }
    async init() {}
    destroy() {}
  } }
})
const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => { for (const w of wrappers) w.unmount(); wrappers.length = 0 })
function project() { return reactive(createRaceProject({ track: 'straight', length: 1, carShape: 'sport', color: 'red', motion: 'dynamic', sound: 'sport', opponents: 2, difficulty: 'normal' })) }
function tick(seconds: number) { for (let i = 0; i < seconds * 60; i++) pixi.tick({ deltaMS: 1000 / 60 }) }
function button(w: ReturnType<typeof mount>, text: string) { return w.findAll('button').find(b => b.text() === text)! }

describe('WorldCanvas entry and restart', () => {
  it('initializes on first run mount, counts down, follows player and restarts', async () => {
    const source = project()
    const w = mount(WorldCanvas, { props: { project: source, mode: 'run', selectedId: null }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    expect(w.text()).toContain('准备出发')
    expect(w.get('[role="status"]').text()).toBe('3')
    tick(1); await flushPromises()
    expect(w.get('[role="status"]').text()).toBe('2')
    tick(1); await flushPromises()
    expect(w.get('[role="status"]').text()).toBe('1')
    tick(1.05); await flushPromises()
    expect(w.get('[role="status"]').text()).toBe('GO!')
    const camera = pixi.camera.x
    await w.get('[aria-label="赛车画布"]').trigger('keydown', { key: 'ArrowUp' })
    tick(2); await flushPromises()
    expect(pixi.camera.x).toBeLessThan(camera)
    expect(w.text()).not.toContain('CPU 1 · 速度 0')
    expect(source.world.entities[0].position.x).toBe(350)
    await button(w, '重新比赛').trigger('click')
    expect(w.text()).toContain('准备出发 · 0.0 秒')
    expect(w.text()).toContain('Player Car · 速度 0 · 路标 0')
    expect(pixi.camera.x).toBe(camera)
    await w.setProps({ mode: 'edit' })
    expect(pixi.camera).toEqual({ x: 0, y: 0 })
    await w.setProps({ mode: 'run' })
    expect(w.text()).toContain('准备出发')
    expect(w.text()).toContain('静音')
  })

  it.each(['player', 'path'] as const)('shows actionable missing %s error and exit actions', async missing => {
    const source = project()
    if (missing === 'player') source.world.entities = source.world.entities.filter(e => e.controlRole !== 'player')
    else delete source.world.trackPath
    const w = mount(WorldCanvas, { props: { project: source, mode: 'run', selectedId: null } })
    wrappers.push(w); await flushPromises()
    expect(w.text()).toContain('无法开始比赛')
    expect(w.text()).toContain(missing === 'player' ? '缺少玩家车' : 'trackPath')
    await button(w, '进入编辑').trigger('click')
    expect(w.emitted('edit')).toHaveLength(1)
    await button(w, '返回首页').trigger('click')
    expect(w.emitted('home')).toHaveLength(1)
  })

  it('clears held keys on blur and leaves editing inputs alone', async () => {
    const w = mount(WorldCanvas, { props: { project: project(), mode: 'edit', selectedId: null }, attachTo: document.body })
    wrappers.push(w); await flushPromises()
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    await w.setProps({ mode: 'run' })
    tick(3.1)
    await w.get('[aria-label="赛车画布"]').trigger('keydown', { key: ' ' })
    tick(1)
    window.dispatchEvent(new Event('blur'))
    tick(5); await flushPromises()
    expect(w.text()).toContain('Player Car · 速度 0')
  })
})
