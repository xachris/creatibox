<script setup lang="ts">
import { Application, FederatedPointerEvent, Graphics } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CreatiBoxProject, Entity, Vec2 } from '../model/types'
import { drawLivingParticipant } from '../render/participant'
import { WorldRuntime, raceStandings } from '../runtime/worldRuntime'
import { DEFAULT_CAR_CONTROLS } from '../model/factory'
import { raceAudio } from '../media/sound/audioDirector'
import { createWorldRenderer, projectedFootY, type IWorldRenderer } from '../render/worldRenderer'
import { createRunViewState, DEFAULT_EDIT_VIEW_STATE, type ViewMode, type ViewState } from '../render/viewState'

const props = defineProps<{
  project: CreatiBoxProject
  selectedId: string | null
  mode: 'edit' | 'run'
  viewMode?: ViewMode
}>()

const emit = defineEmits<{
  select: [id: string | null]
  move: [id: string, x: number, y: number]
  edit: []
  home: []
  viewFallback: [mode: Extract<ViewMode, 'top-down' | 'oblique'>]
}>()

const host = ref<HTMLDivElement | null>(null)
let app: Application | null = null
let renderer: IWorldRenderer | null = null
let firstPersonRenderer: import('../render/firstPersonRenderer').FirstPersonRenderer | null = null
let rendererRequest = 0
let viewState: ViewState = { ...DEFAULT_EDIT_VIEW_STATE }
let runtimeProject: CreatiBoxProject | null = null
let runtime: WorldRuntime | null = null
const runtimeGeneration = ref(0)
let disposed = false
const phase = ref('loading')
const countdown = ref(3)
const elapsed = ref(0)
const error = ref('')
const result = ref('')
const racers = ref<{ id: string; name: string; speed: number; checkpoint: number; finished: boolean }[]>([])
const controlHint = ref('')
let dragging: { id: string; offsetX: number; offsetY: number } | null = null
const keys = new Set<string>()
const muted = ref(raceAudio.isMuted())
let previousPhase: string | null = null
const gait = new Map<string, { x: number; y: number; distance: number }>()
const frameTimes: number[] = []
const renderCosts: number[] = []



function activeProject() {
  return props.mode === 'run' && runtimeProject ? runtimeProject : props.project
}

function activeEntities(): Entity[] {
  return activeProject().world.entities
}

function drawTrack(path: Vec2[]) {
  const activeRenderer = renderer
  const worldLayer = activeRenderer?.worldLayer
  if (!activeRenderer || !worldLayer || path.length < 2) return
  const road = new Graphics()
  const first = activeRenderer.toLayer(path[0])
  road.moveTo(first.x, first.y)
  for (const point of path.slice(1)) {
    const projected = activeRenderer.toLayer(point)
    road.lineTo(projected.x, projected.y)
  }
  road.stroke({ width: activeRenderer.strokeScale(170), color: 0x475569, cap: 'round', join: 'round' })

  const center = new Graphics()
  center.moveTo(first.x, first.y)
  for (const point of path.slice(1)) {
    const projected = activeRenderer.toLayer(point)
    center.lineTo(projected.x, projected.y)
  }
  center.stroke({ width: activeRenderer.strokeScale(4), color: 0xf8fafc, alpha: 0.7, cap: 'round', join: 'round' })

  worldLayer.addChild(road, center)
}

function drawEntity(entity: Entity) {
  const activeRenderer = renderer
  const worldLayer = activeRenderer?.worldLayer
  if (!activeRenderer || !worldLayer) return
  const graphic = new Graphics()
  const selected = props.mode === 'edit' && entity.id === props.selectedId
  const alpha = entity.state === 'Broken' ? 0.42 : 1

  const previous = gait.get(entity.id)
  const distance = (previous?.distance ?? 0) + (previous ? Math.hypot(entity.position.x - previous.x, entity.position.y - previous.y) : 0)
  gait.set(entity.id, { x: entity.position.x, y: entity.position.y, distance })
  const projected = activeRenderer.toLayer(entity.position)
  if (activeRenderer.viewMode === 'oblique' && !['start', 'finish'].includes(entity.kind)) {
    const shadow = new Graphics()
    shadow.roundRect(-entity.size.x * 0.38, -Math.max(3, entity.size.y * 0.08), entity.size.x * 0.76, Math.max(6, entity.size.y * 0.2), 999)
      .fill({ color: 0x1f2937, alpha: 0.2 })
    shadow.position.set(projected.x, projected.y)
    worldLayer.addChild(shadow)
  }
  if (drawLivingParticipant(graphic, entity, distance)) {
    if (selected) graphic.circle(0, 0, 32).stroke({ width: 2, color: 0x2563eb })
  } else if (entity.kind === 'tree') {
    if (activeRenderer.viewMode === 'oblique') {
      graphic.rect(-6, -entity.size.y * 0.45, 12, entity.size.y * 0.45).fill(0x7c4a2d)
      const crown = new Graphics()
      const player = runtime?.player
      const treeScreen = activeRenderer.project(entity.position)
      const playerScreen = player ? activeRenderer.project(player.position) : null
      const zoom = activeRenderer.worldLayer.scale.x || 1
      const occludesPlayer = !!player && !!playerScreen
        && projectedFootY(entity) > projectedFootY(player)
        && Math.abs(treeScreen.x - playerScreen.x) < entity.size.x * 0.72 * zoom
        && treeScreen.y - playerScreen.y > 0
        && treeScreen.y - playerScreen.y < entity.size.y * 0.9 * zoom
      const crownAlpha = occludesPlayer ? 0.42 : alpha
      crown.circle(0, -entity.size.y * 0.55, entity.size.x * 0.5).fill({ color: entity.color, alpha: crownAlpha })
        .circle(-entity.size.x * 0.22, -entity.size.y * 0.42, entity.size.x * 0.32).fill({ color: 0x16a34a, alpha: crownAlpha })
      crown.position.set(projected.x, projected.y)
      worldLayer.addChild(graphic, crown)
    } else {
      graphic
        .rect(-6, 4, 12, entity.size.y * 0.45)
        .fill(0x7c4a2d)
        .circle(0, -entity.size.y * 0.16, entity.size.x * 0.5)
        .fill({ color: entity.color, alpha })
        .circle(-entity.size.x * 0.22, -entity.size.y * 0.03, entity.size.x * 0.32)
        .fill({ color: 0x16a34a, alpha })
    }
  } else {
    graphic
      .roundRect(-entity.size.x / 2, -entity.size.y / 2, entity.size.x, entity.size.y, entity.kind === 'car' ? 10 : 5)
      .fill({ color: entity.color, alpha })
      .stroke({ width: selected ? 4 : 1.5, color: selected ? 0x2563eb : 0xffffff, alpha: 0.92 })
  }

  if (entity.kind === 'finish') {
    const cell = entity.size.x / 6
    for (let i = 0; i < 6; i++) {
      graphic.rect(-entity.size.x / 2 + i * cell, -entity.size.y / 2, cell, entity.size.y)
        .fill(i % 2 === 0 ? 0xffffff : 0x111827)
    }
  }

  if (entity.kind === 'start') {
    graphic.rect(-entity.size.x / 2, -entity.size.y / 2, entity.size.x, entity.size.y).fill(0x2563eb)
  }

  if (entity.kind === 'car') {
    const wheelCount = Math.max(2, Math.min(8, entity.wheelCount ?? 4))
    const pairs = Math.max(1, Math.ceil(wheelCount / 2))
    for (let i = 0; i < pairs; i++) {
      const t = pairs === 1 ? 0.5 : i / (pairs - 1)
      const x = -entity.size.x * 0.31 + t * entity.size.x * 0.62
      graphic.circle(x, entity.size.y * 0.48, 5).fill(0x111827)
      if (i * 2 + 1 < wheelCount) graphic.circle(x, -entity.size.y * 0.48, 5).fill(0x111827)
    }

    if ((entity.carShape ?? 'classic') === 'sport') {
      graphic
        .poly([
          -entity.size.x * 0.35, -entity.size.y * 0.33,
          entity.size.x * 0.20, -entity.size.y * 0.33,
          entity.size.x * 0.40, 0,
          entity.size.x * 0.20, entity.size.y * 0.33,
          -entity.size.x * 0.35, entity.size.y * 0.33,
        ])
        .stroke({ width: 2, color: 0xffffff, alpha: 0.72 })
    } else if ((entity.carShape ?? 'classic') === 'boxy') {
      graphic.rect(-entity.size.x * 0.18, -entity.size.y * 0.27, entity.size.x * 0.36, entity.size.y * 0.54)
        .stroke({ width: 2, color: 0xffffff, alpha: 0.72 })
    } else {
      graphic.roundRect(-entity.size.x * 0.12, -entity.size.y * 0.26, entity.size.x * 0.32, entity.size.y * 0.52, 5)
        .stroke({ width: 2, color: 0xffffff, alpha: 0.62 })
    }

    if (props.mode === 'run' && entity.motionPreset === 'dynamic' && entity.speed > (entity.race?.maxSpeed ?? 260) * 0.55) {
      graphic
        .moveTo(-entity.size.x * 0.65, -entity.size.y * 0.22)
        .lineTo(-entity.size.x * 1.15, -entity.size.y * 0.22)
        .moveTo(-entity.size.x * 0.65, entity.size.y * 0.22)
        .lineTo(-entity.size.x * 1.15, entity.size.y * 0.22)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.48 })
    }
  }

  graphic.position.set(projected.x, projected.y)
  graphic.rotation = entity.kind === 'tree' && activeRenderer.viewMode === 'oblique' ? 0 : activeRenderer.projectRotation(entity.rotation)
  graphic.eventMode = 'static'
  graphic.cursor = props.mode === 'edit' ? 'move' : 'default'

  graphic.on('pointerdown', (event: FederatedPointerEvent) => {
    if (props.mode !== 'edit') return
    event.stopPropagation()
    emit('select', entity.id)
    const world = renderer?.unproject(event.global) ?? event.global
    const worldX = world.x
    const worldY = world.y
    dragging = {
      id: entity.id,
      offsetX: worldX - entity.position.x,
      offsetY: worldY - entity.position.y,
    }
  })

  if (!(entity.kind === 'tree' && activeRenderer.viewMode === 'oblique')) worldLayer.addChild(graphic)
}

function render() {
  if (!app || !renderer) return
  const project = activeProject()
  if (firstPersonRenderer && runtime && props.mode === 'run' && props.viewMode === 'first-person') {
    const stats = firstPersonRenderer.render(project, runtime.player)
    if (host.value) {
      host.value.dataset.drawCalls = String(stats.drawCalls)
      host.value.dataset.triangles = String(stats.triangles)
      host.value.dataset.visibleEntities = String(project.world.entities.length)
      host.value.dataset.totalEntities = String(project.world.entities.length)
    }
    return
  }
  const bounds = project.world.worldBounds ?? { width: app.screen.width, height: app.screen.height }

  renderer.render(worldLayer => {
    const ground = new Graphics()
    const corners = [
      renderer!.toLayer({ x: 0, y: 0 }),
      renderer!.toLayer({ x: bounds.width, y: 0 }),
      renderer!.toLayer({ x: bounds.width, y: bounds.height }),
      renderer!.toLayer({ x: 0, y: bounds.height }),
    ]
    ground.poly(corners.flatMap(point => [point.x, point.y])).fill(0xdbe7cf)
    worldLayer.addChild(ground)

    if (project.world.trackPath?.length) drawTrack(project.world.trackPath)
    const allEntities = activeEntities()
    const visibleEntities = renderer!.visibleEntities(allEntities)
    if (host.value) {
      host.value.dataset.visibleEntities = String(visibleEntities.length)
      host.value.dataset.totalEntities = String(allEntities.length)
    }
    for (const entity of renderer!.orderEntities(visibleEntities)) {
      if (entity.kind !== 'road') drawEntity(entity)
    }
  })
}

function followPlayer(player: Entity, deltaSeconds = 0) {
  if (props.viewMode === 'first-person') return
  renderer?.updateCamera(viewState, player, deltaSeconds)
}

function setPixiVisible(visible: boolean) {
  if (app?.canvas) app.canvas.style.display = visible ? 'block' : 'none'
}

function disposeFirstPersonRenderer() {
  rendererRequest += 1
  firstPersonRenderer?.dispose()
  firstPersonRenderer = null
  setPixiVisible(true)
}

async function activateView(viewMode: ViewMode) {
  if (!app || !renderer || props.mode !== 'run') return
  const request = ++rendererRequest
  if (viewMode !== 'first-person') {
    firstPersonRenderer?.dispose()
    firstPersonRenderer = null
    setPixiVisible(true)
    if (renderer.viewMode !== viewMode) {
      renderer.dispose()
      renderer = createWorldRenderer(app, viewMode)
    }
    viewState = { ...viewState, viewMode }
    if (runtime) followPlayer(runtime.player)
    render()
    return
  }

  try {
    const { FirstPersonRenderer } = await import('../render/firstPersonRenderer')
    if (request !== rendererRequest || !host.value || !runtimeProject || props.viewMode !== 'first-person') return
    firstPersonRenderer?.dispose()
    firstPersonRenderer = new FirstPersonRenderer(host.value, runtimeProject)
    setPixiVisible(false)
    viewState = { ...viewState, viewMode }
    render()
  } catch (cause) {
    if (request !== rendererRequest) return
    firstPersonRenderer?.dispose()
    firstPersonRenderer = null
    setPixiVisible(true)
    if (host.value) host.value.dataset.viewFallbackReason = cause instanceof Error ? cause.message : 'First-Person 初始化失败'
    emit('viewFallback', 'top-down')
  }
}

function syncHud() {
  if (!runtime) return
  phase.value = runtime.phase
  countdown.value = Math.ceil(runtime.countdown - 1e-8)
  elapsed.value = runtime.elapsed
  racers.value = raceStandings(runtime).map(car => ({
    id: car.id, name: car.name, speed: Math.round(car.speed),
    checkpoint: (car.waypointIndex ?? 1) - 1, finished: car.state === 'Finished',
  }))
  if (runtime.phase === 'finished') {
    result.value = runtime.player.state === 'Finished'
      ? `你已抵达终点！第 ${runtime.finishOrder.indexOf(runtime.player.id) + 1} 名 · ${runtime.elapsed.toFixed(1)} 秒`
      : '已退出比赛，重赛再试一次吧。'
  }
}


function toggleMute() {
  muted.value = raceAudio.toggleMuted()
}

function syncRaceAudio() {
  if (!runtime) return
  const player = runtime.player
  const controls = player.controls ?? DEFAULT_CAR_CONTROLS
  if (runtime.phase === 'countdown') {
    raceAudio.onCountdown(runtime.countdown)
  }
  if (previousPhase === 'countdown' && runtime.phase === 'racing') {
    raceAudio.onGo()
  }
  if (runtime.phase === 'racing') {
    const accelerating = keys.has(controls.accelerate.toLowerCase()) || !!(controls.primary && keys.has(controls.primary.toLowerCase()))
    const braking = keys.has(controls.brake.toLowerCase())
    raceAudio.syncEngine({
      speed: player.speed,
      maxSpeed: player.race!.maxSpeed,
      accelerating,
      braking,
    })
    raceAudio.onContacts(runtime.collisionEvents)
  }
  if (runtime.phase === 'finished' && previousPhase !== 'finished') {
    if (player.state === 'Broken') raceAudio.onFinish('broken')
    else if (runtime.finishOrder[0] === player.id) raceAudio.onFinish('win')
    else raceAudio.onFinish('place')
  }
  previousPhase = runtime.phase
}

function initializeRuntime() {
  keys.clear()
  gait.clear()
  frameTimes.length = 0
  renderCosts.length = 0
  raceAudio.stopAll()
  dragging = null
  runtime = null
  runtimeProject = null
  error.value = ''
  result.value = ''
  racers.value = []
  if (!app || !renderer) return
  elapsed.value = 0
  countdown.value = 3
  controlHint.value = ''
  try {
    runtime = new WorldRuntime(props.project)
    runtimeGeneration.value += 1
    runtimeProject = runtime.project
    viewState = createRunViewState(runtime.player.id, props.viewMode ?? 'top-down')
    previousPhase = null
    raceAudio.beginRace(runtime.player.soundPreset ?? 'sport', runtime.player.id, runtime.player.movementStyle)
    muted.value = raceAudio.isMuted()
    const c = runtime.player.controls ?? DEFAULT_CAR_CONTROLS
    const label = (key?: string) => key === ' ' ? 'Space' : ({ arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' }[key?.toLowerCase() ?? ''] ?? key?.toUpperCase() ?? '无')
    controlHint.value = `${label(c.left)} / ${label(c.right)} 转向 · ${label(c.accelerate)} 前进 · ${label(c.brake)} 刹车 · ${label(c.primary)} 强加速`
    followPlayer(runtime.player)
    syncHud()
    host.value?.focus()
  } catch (cause) {
    phase.value = 'error'
    error.value = cause instanceof Error ? cause.message : '比赛启动失败，请重新比赛。'
  }
  render()
}

function runStep(deltaSeconds: number) {
  if (!runtime || document.hidden) return
  const renderStarted = import.meta.env.DEV ? performance.now() : 0
  runtime.step(deltaSeconds, keys)
  followPlayer(runtime.player, deltaSeconds)
  syncHud()
  syncRaceAudio()
  render()
  if (import.meta.env.DEV && host.value) {
    frameTimes.push(deltaSeconds * 1000)
    renderCosts.push(performance.now() - renderStarted)
    if (frameTimes.length > 120) frameTimes.shift()
    if (renderCosts.length > 120) renderCosts.shift()
    const sorted = [...frameTimes].sort((a, b) => a - b)
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    host.value.dataset.medianFps = (1000 / sorted[Math.floor(sorted.length / 2)]).toFixed(1)
    host.value.dataset.frameP95Ms = p95.toFixed(2)
    host.value.dataset.renderAverageMs = (renderCosts.reduce((sum, value) => sum + value, 0) / renderCosts.length).toFixed(2)
  }
}

onMounted(async () => {
  if (!host.value) return
  const instance = new Application()
  app = instance
  try {
    await instance.init({
      background: '#dbe7cf',
      antialias: true,
      resizeTo: host.value,
    })
    if (disposed || !host.value) { instance.destroy(true, { children: true }); return }
    host.value.appendChild(app.canvas)

    renderer = createWorldRenderer(app, props.mode === 'run' && props.viewMode === 'oblique' ? 'oblique' : 'top-down')
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen

    app.stage.on('pointerdown', () => {
      if (props.mode === 'edit') emit('select', null)
      else host.value?.focus()
    })
    app.stage.on('pointermove', (event: FederatedPointerEvent) => {
      if (!dragging || props.mode !== 'edit') return
      const world = renderer?.unproject(event.global) ?? event.global
      const worldX = world.x
      const worldY = world.y
      emit('move', dragging.id, worldX - dragging.offsetX, worldY - dragging.offsetY)
    })
    app.stage.on('pointerup', () => { dragging = null })
    app.stage.on('pointerupoutside', () => { dragging = null })

    app.ticker.add((ticker) => {
      if (props.mode === 'run') runStep(ticker.deltaMS / 1000)
    })

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    document.addEventListener('visibilitychange', clearKeys)
    if (props.mode === 'run') {
      initializeRuntime()
      if (props.viewMode === 'first-person') void activateView('first-person')
    }
    else render()
  } catch {
    if (!disposed) { phase.value = 'error'; error.value = '画布加载失败，请刷新页面后重试。' }
  }
})

function clearKeys() { keys.clear() }

function onKeyDown(event: KeyboardEvent) {
  if (props.mode !== 'run' || !runtime || runtime.phase === 'finished') return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return
  const controls = runtime.player.controls ?? DEFAULT_CAR_CONTROLS
  if (!Object.values(controls).some(key => key?.toLowerCase() === event.key.toLowerCase())) return
  keys.add(event.key.toLowerCase())
  event.preventDefault()
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.key.toLowerCase())
}

watch(() => props.mode, (mode) => {
  if (!app) return
  disposeFirstPersonRenderer()
  renderer?.dispose()
  renderer = createWorldRenderer(app, mode === 'run' && props.viewMode === 'oblique' ? 'oblique' : 'top-down')
  if (mode === 'run') {
    initializeRuntime()
    if (props.viewMode === 'first-person') void activateView('first-person')
  }
  else {
    raceAudio.stopAll()
    previousPhase = null
    clearKeys()
    runtime = null
    runtimeProject = null
    error.value = ''
    viewState = { ...DEFAULT_EDIT_VIEW_STATE }
    renderer?.resetCamera()
    render()
  }
})

watch(() => props.viewMode, (viewMode) => {
  if (!app || props.mode !== 'run' || !viewMode) return
  void activateView(viewMode)
})

watch(() => props.project, () => {
  if (props.mode === 'edit') render()
}, { deep: true })

watch(() => props.selectedId, render)

onBeforeUnmount(() => {
  disposed = true
  raceAudio.stopAll()
  clearKeys()
  window.removeEventListener('blur', clearKeys)
  document.removeEventListener('visibilitychange', clearKeys)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  disposeFirstPersonRenderer()
  renderer?.dispose()
  if (renderer) app?.destroy(true, { children: true })
  app = null
  renderer = null
})
</script>

<template>
  <div class="race-stage">
    <div
      ref="host"
      class="world-canvas"
      tabindex="0"
      aria-label="赛车画布"
      :data-view-mode="mode === 'run' ? (viewMode ?? 'top-down') : 'top-down'"
      :data-runtime-generation="runtimeGeneration"
    />
    <template v-if="mode === 'run'">
      <div v-if="!error" class="race-hud">
        <strong>{{ phase === 'countdown' ? '准备出发' : phase === 'finished' ? '比赛结束' : '比赛中' }} · {{ elapsed.toFixed(1) }} 秒</strong>
        <span>{{ controlHint }}</span>
        <div class="race-standings" aria-label="比赛进度">
          <span v-for="car in racers" :key="car.id">{{ car.name }} · {{ car.finished ? '已完赛' : phase === 'finished' ? '未完赛' : `速度 ${car.speed} · 路标 ${car.checkpoint}` }}</span>
        </div>
      </div>
      <div v-if="phase === 'countdown' || (phase === 'racing' && elapsed < 0.8)" class="race-countdown" role="status">{{ phase === 'countdown' ? countdown : 'GO!' }}</div>
      <div v-if="phase === 'finished' || error" class="race-result" role="status">
        <h2>{{ error ? '无法开始比赛' : '比赛结束' }}</h2>
        <p>{{ error || result }}</p>
        <button type="button" class="audio-toggle" :aria-pressed="muted" @click="toggleMute">{{ muted ? '取消静音' : '静音' }}</button>
        <button class="primary" @click="initializeRuntime">重新比赛</button>
        <button @click="emit('edit')">进入编辑</button>
        <button @click="emit('home')">返回首页</button>
      </div>
      <div v-else class="race-actions">
        <button type="button" class="audio-toggle" :aria-pressed="muted" @click="toggleMute">{{ muted ? '取消静音' : '静音' }}</button>
        <button @click="initializeRuntime">重新比赛</button>
        <button @click="emit('edit')">进入编辑</button>
        <button @click="emit('home')">返回首页</button>
      </div>
    </template>
    <div v-else-if="error" class="race-result" role="alert">{{ error }}</div>
  </div>
</template>
