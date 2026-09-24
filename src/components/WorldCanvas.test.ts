// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import WorldCanvas from './WorldCanvas.vue'
import { createRaceProject } from '../model/raceGenerator'

const pixi = vi.hoisted(() => ({ tick: (_: { deltaMS: number }) => {}, camera: { x: 0, y: 0 } }))
const three = vi.hoisted(() => ({ mounts: 0, disposals: 0, renders: 0, fail: false }))
vi.mock('../render/firstPersonRenderer', () => ({
  FirstPersonRenderer: class {
    readonly canvas = document.createElement('canvas')
    constructor(host: HTMLElement) {
      if (three.fail) throw new Error('WebGL unavailable')
      this.canvas.dataset.renderer = 'first-person'; host.appendChild(this.canvas); three.mounts += 1
    }
    render() { three.renders += 1; return { drawCalls: 12, triangles: 24 } }
    dispose() { this.canvas.remove(); three.disposals += 1 }
  },
}))
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
    scale = { x: 1, y: 1, set: (value: number) => { this.scale.x = value; this.scale.y = value } }
    rotation = 0
    addChild() {}
    removeChildren() { return [] }
    removeFromParent() {}
    destroy() {}
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
  it('produces the same runtime progress in top-down and oblique views', async () => {
    async function progress(viewMode: 'top-down' | 'oblique') {
      const w = mount(WorldCanvas, { props: { project: project(), mode: 'run', selectedId: null, viewMode } })
      wrappers.push(w)
      await flushPromises()
      tick(8)
      await flushPromises()
      const value = w.get('[aria-label="比赛进度"]').text()
      w.unmount()
      wrappers.splice(wrappers.indexOf(w), 1)
      return value
    }

    expect(await progress('oblique')).toBe(await progress('top-down'))
  })

  it('switches renderers without rebuilding or resetting the running world', async () => {
    const w = mount(WorldCanvas, { props: { project: project(), mode: 'run', selectedId: null, viewMode: 'top-down' }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    tick(5)
    await flushPromises()
    const canvas = w.get('[aria-label="赛车画布"]')
    const progress = w.get('[aria-label="比赛进度"]').text()
    expect(canvas.attributes('data-runtime-generation')).toBe('1')

    await w.setProps({ viewMode: 'oblique' })
    await flushPromises()
    expect(canvas.attributes('data-view-mode')).toBe('oblique')
    expect(canvas.attributes('data-runtime-generation')).toBe('1')
    expect(w.get('[aria-label="比赛进度"]').text()).toBe(progress)

    for (let index = 0; index < 50; index++) {
      await w.setProps({ viewMode: index % 2 === 0 ? 'top-down' : 'oblique' })
    }
    tick(1)
    await flushPromises()
    expect(canvas.attributes('data-runtime-generation')).toBe('1')
    expect(w.get('[aria-label="比赛进度"]').text()).not.toBe(progress)
    expect(w.findAll('canvas')).toHaveLength(1)
  })

  it('switches through first-person without rebuilding Runtime and disposes its canvas', async () => {
    const w = mount(WorldCanvas, { props: { project: project(), mode: 'run', selectedId: null, viewMode: 'top-down' }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    tick(5)
    const canvas = w.get('[aria-label="赛车画布"]')
    const progress = w.get('[aria-label="比赛进度"]').text()

    await w.setProps({ viewMode: 'first-person' })
    await flushPromises()
    tick(1)
    expect(canvas.attributes('data-runtime-generation')).toBe('1')
    expect(canvas.attributes('data-draw-calls')).toBe('12')
    expect(three.renders).toBeGreaterThan(0)
    expect(w.findAll('canvas')).toHaveLength(2)

    await w.setProps({ viewMode: 'oblique' })
    await flushPromises()
    expect(canvas.attributes('data-runtime-generation')).toBe('1')
    expect(three.disposals).toBeGreaterThan(0)
    expect(w.findAll('canvas')).toHaveLength(1)
    expect(w.get('[aria-label="比赛进度"]').text()).not.toBe(progress)
  })

  it('cleans up 50 first-person switches and falls back when initialization fails', async () => {
    const w = mount(WorldCanvas, { props: { project: project(), mode: 'run', selectedId: null, viewMode: 'top-down' }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    const startMounts = three.mounts
    const startDisposals = three.disposals
    for (let index = 0; index < 50; index++) {
      await w.setProps({ viewMode: index % 2 === 0 ? 'first-person' : 'top-down' })
      await flushPromises()
    }
    expect(three.mounts - startMounts).toBe(25)
    expect(three.disposals - startDisposals).toBe(25)
    expect(w.findAll('[data-renderer="first-person"]')).toHaveLength(0)
    expect(w.get('[aria-label="赛车画布"]').attributes('data-runtime-generation')).toBe('1')

    three.fail = true
    await w.setProps({ viewMode: 'first-person' })
    await flushPromises()
    expect(w.emitted('viewFallback')?.at(-1)).toEqual(['top-down'])
    expect(w.get('[aria-label="赛车画布"]').attributes('data-view-fallback-reason')).toBe('WebGL unavailable')
    three.fail = false
  })

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
