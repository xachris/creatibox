<script setup lang="ts">
import { Application, Container, FederatedPointerEvent, Graphics } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CreatiBoxProject, Entity, Vec2 } from '../model/types'
import { WorldRuntime } from '../runtime/worldRuntime'
import { DEFAULT_CAR_CONTROLS } from '../model/factory'

const props = defineProps<{
  project: CreatiBoxProject
  selectedId: string | null
  mode: 'edit' | 'run'
}>()

const emit = defineEmits<{
  select: [id: string | null]
  move: [id: string, x: number, y: number]
  edit: []
  home: []
}>()

const host = ref<HTMLDivElement | null>(null)
let app: Application | null = null
let worldLayer: Container | null = null
let runtimeProject: CreatiBoxProject | null = null
let runtime: WorldRuntime | null = null
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


function activeProject() {
  return props.mode === 'run' && runtimeProject ? runtimeProject : props.project
}

function activeEntities(): Entity[] {
  return activeProject().world.entities
}

function drawTrack(path: Vec2[]) {
  if (!worldLayer || path.length < 2) return
  const road = new Graphics()
  road.moveTo(path[0].x, path[0].y)
  for (const point of path.slice(1)) road.lineTo(point.x, point.y)
  road.stroke({ width: 170, color: 0x475569, cap: 'round', join: 'round' })

  const center = new Graphics()
  center.moveTo(path[0].x, path[0].y)
  for (const point of path.slice(1)) center.lineTo(point.x, point.y)
  center.stroke({ width: 4, color: 0xf8fafc, alpha: 0.7, cap: 'round', join: 'round' })

  worldLayer.addChild(road, center)
}

function drawEntity(entity: Entity) {
  if (!worldLayer) return
  const graphic = new Graphics()
  const selected = props.mode === 'edit' && entity.id === props.selectedId
  const alpha = entity.state === 'Broken' ? 0.42 : 1

  if (entity.kind === 'tree') {
    graphic
      .rect(-6, 4, 12, entity.size.y * 0.45)
      .fill(0x7c4a2d)
      .circle(0, -entity.size.y * 0.16, entity.size.x * 0.5)
      .fill({ color: entity.color, alpha })
      .circle(-entity.size.x * 0.22, -entity.size.y * 0.03, entity.size.x * 0.32)
      .fill({ color: 0x16a34a, alpha })
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

    if (props.mode === 'run' && entity.motionPreset === 'dynamic' && entity.speed > entity.maxSpeed * 0.55) {
      graphic
        .moveTo(-entity.size.x * 0.65, -entity.size.y * 0.22)
        .lineTo(-entity.size.x * 1.15, -entity.size.y * 0.22)
        .moveTo(-entity.size.x * 0.65, entity.size.y * 0.22)
        .lineTo(-entity.size.x * 1.15, entity.size.y * 0.22)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.48 })
    }
  }

  graphic.position.set(entity.position.x, entity.position.y)
  graphic.rotation = entity.rotation
  graphic.eventMode = 'static'
  graphic.cursor = props.mode === 'edit' ? 'move' : 'default'

  graphic.on('pointerdown', (event: FederatedPointerEvent) => {
    if (props.mode !== 'edit') return
    event.stopPropagation()
    emit('select', entity.id)
    const worldX = event.global.x - (worldLayer?.position.x ?? 0)
    const worldY = event.global.y - (worldLayer?.position.y ?? 0)
    dragging = {
      id: entity.id,
      offsetX: worldX - entity.position.x,
      offsetY: worldY - entity.position.y,
    }
  })

  worldLayer.addChild(graphic)
}

function render() {
  if (!app || !worldLayer) return
  worldLayer.removeChildren().forEach((child) => child.destroy())
  const project = activeProject()
  const bounds = project.world.worldBounds ?? { width: app.screen.width, height: app.screen.height }

  const ground = new Graphics()
  ground.rect(0, 0, bounds.width, bounds.height).fill(0xdbe7cf)
  worldLayer.addChild(ground)

  if (project.world.trackPath?.length) drawTrack(project.world.trackPath)
  for (const entity of activeEntities()) {
    if (entity.kind !== 'road') drawEntity(entity)
  }
}

function followPlayer(player: Entity) {
  if (!app || !worldLayer) return
  worldLayer.position.set(
    app.screen.width / 2 - player.position.x,
    app.screen.height / 2 - player.position.y,
  )
}

function syncHud() {
  if (!runtime) return
  phase.value = runtime.phase
  countdown.value = Math.ceil(runtime.countdown - 1e-8)
  elapsed.value = runtime.elapsed
  racers.value = runtime.cars.map(car => ({
    id: car.id, name: car.name, speed: Math.round(car.speed),
    checkpoint: (car.waypointIndex ?? 1) - 1, finished: car.state === 'Finished',
  }))
  if (runtime.phase === 'finished') {
    result.value = runtime.player.state === 'Finished'
      ? `你已抵达终点！第 ${runtime.finishOrder.indexOf(runtime.player.id) + 1} 名 · ${runtime.elapsed.toFixed(1)} 秒`
      : '赛车受损无法继续，重赛再试一次吧。'
  }
}

function initializeRuntime() {
  keys.clear()
  dragging = null
  runtime = null
  runtimeProject = null
  error.value = ''
  result.value = ''
  racers.value = []
  if (!app || !worldLayer) return
  elapsed.value = 0
  countdown.value = 3
  controlHint.value = ''
  try {
    runtime = new WorldRuntime(props.project)
    runtimeProject = runtime.project
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
  runtime.step(deltaSeconds, keys)
  followPlayer(runtime.player)
  syncHud()
  render()
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

    worldLayer = new Container()
    app.stage.addChild(worldLayer)
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen

    app.stage.on('pointerdown', () => {
      if (props.mode === 'edit') emit('select', null)
      else host.value?.focus()
    })
    app.stage.on('pointermove', (event: FederatedPointerEvent) => {
      if (!dragging || props.mode !== 'edit') return
      const worldX = event.global.x - (worldLayer?.position.x ?? 0)
      const worldY = event.global.y - (worldLayer?.position.y ?? 0)
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
    if (props.mode === 'run') initializeRuntime()
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
  if (mode === 'run') initializeRuntime()
  else {
    clearKeys()
    runtime = null
    runtimeProject = null
    error.value = ''
    worldLayer?.position.set(0, 0)
    render()
  }
})

watch(() => props.project, () => {
  if (props.mode === 'edit') render()
}, { deep: true })

watch(() => props.selectedId, render)

onBeforeUnmount(() => {
  disposed = true
  clearKeys()
  window.removeEventListener('blur', clearKeys)
  document.removeEventListener('visibilitychange', clearKeys)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (worldLayer) app?.destroy(true, { children: true })
  app = null
  worldLayer = null
})
</script>

<template>
  <div class="race-stage">
    <div ref="host" class="world-canvas" tabindex="0" aria-label="赛车画布" />
    <template v-if="mode === 'run'">
      <div v-if="!error" class="race-hud">
        <strong>{{ phase === 'countdown' ? '准备出发' : phase === 'finished' ? '比赛结束' : '比赛中' }} · {{ elapsed.toFixed(1) }} 秒</strong>
        <span>{{ controlHint }}</span>
        <div class="race-standings" aria-label="比赛进度">
          <span v-for="car in racers" :key="car.id">{{ car.name }} · {{ car.finished ? '已完赛' : `速度 ${car.speed} · 路标 ${car.checkpoint}` }}</span>
        </div>
      </div>
      <div v-if="phase === 'countdown' || (phase === 'racing' && elapsed < 0.8)" class="race-countdown" role="status">{{ phase === 'countdown' ? countdown : 'GO!' }}</div>
      <div v-if="phase === 'finished' || error" class="race-result" role="status">
        <h2>{{ error ? '无法开始比赛' : '比赛结束' }}</h2>
        <p>{{ error || result }}</p>
        <button class="primary" @click="initializeRuntime">重新比赛</button>
        <button @click="emit('edit')">进入编辑</button>
        <button @click="emit('home')">返回首页</button>
      </div>
      <div v-else class="race-actions">
        <button @click="initializeRuntime">重新比赛</button>
        <button @click="emit('edit')">进入编辑</button>
        <button @click="emit('home')">返回首页</button>
      </div>
    </template>
    <div v-else-if="error" class="race-result" role="alert">{{ error }}</div>
  </div>
</template>
