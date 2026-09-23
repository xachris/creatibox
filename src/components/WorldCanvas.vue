<script setup lang="ts">
import { Application, FederatedPointerEvent, Graphics } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CreatiBoxProject, Entity } from '../model/types'
import { applyInteractionRule, intersects, matchingRule } from '../runtime/rules'

const props = defineProps<{
  project: CreatiBoxProject
  selectedId: string | null
  mode: 'edit' | 'run'
}>()

const emit = defineEmits<{
  select: [id: string | null]
  move: [id: string, x: number, y: number]
}>()

const host = ref<HTMLDivElement | null>(null)
let app: Application | null = null
let runtimeProject: CreatiBoxProject | null = null
let dragging: { id: string; offsetX: number; offsetY: number } | null = null
const keys = new Set<string>()
const activeContacts = new Set<string>()

function activeEntities(): Entity[] {
  return props.mode === 'run' && runtimeProject
    ? runtimeProject.world.entities
    : props.project.world.entities
}

function drawEntity(entity: Entity) {
  if (!app) return
  const graphic = new Graphics()
  const selected = props.mode === 'edit' && entity.id === props.selectedId
  const alpha = entity.state === 'Broken' ? 0.42 : 1

  graphic
    .roundRect(-entity.size.x / 2, -entity.size.y / 2, entity.size.x, entity.size.y, 7)
    .fill({ color: entity.color, alpha })
    .stroke({ width: selected ? 4 : 1.5, color: selected ? 0x2563eb : 0xffffff, alpha: 0.95 })

  if (entity.kind === 'finish') {
    graphic
      .rect(-entity.size.x / 2, -entity.size.y / 2, entity.size.x / 5, entity.size.y)
      .fill(0xffffff)
      .rect(-entity.size.x / 10, -entity.size.y / 2, entity.size.x / 5, entity.size.y)
      .fill(0x111827)
      .rect(entity.size.x * 0.3, -entity.size.y / 2, entity.size.x / 5, entity.size.y)
      .fill(0xffffff)
  }

  if (entity.kind === 'car') {
    const wheelCount = Math.max(2, Math.min(8, entity.wheelCount ?? 4))
    const pairs = Math.max(1, Math.ceil(wheelCount / 2))
    for (let i = 0; i < pairs; i++) {
      const t = pairs === 1 ? 0.5 : i / (pairs - 1)
      const x = -entity.size.x * 0.32 + t * entity.size.x * 0.64
      graphic.circle(x, entity.size.y * 0.44, 5).fill(0x111827)
      if (i * 2 + 1 < wheelCount) graphic.circle(x, -entity.size.y * 0.44, 5).fill(0x111827)
    }
    if ((entity.carShape ?? 'classic') === 'sport') {
      graphic
        .poly([
          -entity.size.x * 0.34, -entity.size.y * 0.34,
          entity.size.x * 0.18, -entity.size.y * 0.34,
          entity.size.x * 0.38, 0,
          entity.size.x * 0.18, entity.size.y * 0.34,
          -entity.size.x * 0.34, entity.size.y * 0.34,
        ])
        .stroke({ width: 2, color: 0xffffff, alpha: 0.7 })
    }
    if ((entity.carShape ?? 'classic') === 'boxy') {
      graphic.rect(-entity.size.x * 0.18, -entity.size.y * 0.25, entity.size.x * 0.36, entity.size.y * 0.5)
        .stroke({ width: 2, color: 0xffffff, alpha: 0.7 })
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
    dragging = {
      id: entity.id,
      offsetX: event.global.x - entity.position.x,
      offsetY: event.global.y - entity.position.y,
    }
  })

  app.stage.addChild(graphic)
}

function render() {
  if (!app) return
  app.stage.removeChildren().forEach((child) => child.destroy())
  for (const entity of activeEntities()) drawEntity(entity)
}

function runStep(deltaSeconds: number) {
  if (!runtimeProject) return
  const world = runtimeProject.world
  const car = world.entities.find((entity) => entity.kind === 'car')
  if (!car || car.state === 'Broken' || car.state === 'Finished') return

  const accelerating = keys.has('ArrowUp') || keys.has('w')
  const braking = keys.has('ArrowDown') || keys.has('s')
  const left = keys.has('ArrowLeft') || keys.has('a')
  const right = keys.has('ArrowRight') || keys.has('d')

  if (accelerating) car.speed = Math.min(car.maxSpeed, car.speed + 160 * deltaSeconds)
  else car.speed = Math.max(0, car.speed - 70 * deltaSeconds)

  if (braking) car.speed = Math.max(0, car.speed - 220 * deltaSeconds)

  const turn = (right ? 1 : 0) - (left ? 1 : 0)
  car.rotation += turn * 2.4 * deltaSeconds * Math.max(0.25, car.speed / Math.max(car.maxSpeed, 1))

  if (car.speed > 0) {
    car.state = 'Moving'
    car.position.x += Math.cos(car.rotation) * car.speed * deltaSeconds
    car.position.y += Math.sin(car.rotation) * car.speed * deltaSeconds
  } else if (car.state === 'Moving') {
    car.state = 'Idle'
  }

  const width = app?.screen.width ?? 800
  const height = app?.screen.height ?? 600
  car.position.x = Math.max(car.size.x / 2, Math.min(width - car.size.x / 2, car.position.x))
  car.position.y = Math.max(car.size.y / 2, Math.min(height - car.size.y / 2, car.position.y))

  for (const target of world.entities) {
    if (target.id === car.id || target.kind === 'road' || target.kind === 'start') continue
    const key = `${car.id}:${target.id}`
    const touching = intersects(car, target)
    if (touching && !activeContacts.has(key)) {
      activeContacts.add(key)
      const rule = matchingRule(world.rules, car, target)
      if (rule) applyInteractionRule(car, target, rule)
      if (target.kind !== 'finish') {
        car.speed *= 0.35
        car.position.x -= Math.cos(car.rotation) * 12
        car.position.y -= Math.sin(car.rotation) * 12
      }
    } else if (!touching) {
      activeContacts.delete(key)
    }
  }

  render()
}

onMounted(async () => {
  if (!host.value) return
  app = new Application()
  await app.init({
    background: '#eef2f7',
    antialias: true,
    resizeTo: host.value,
  })
  host.value.appendChild(app.canvas)
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen

  app.stage.on('pointerdown', () => emit('select', null))
  app.stage.on('pointermove', (event: FederatedPointerEvent) => {
    if (!dragging || props.mode !== 'edit') return
    emit('move', dragging.id, event.global.x - dragging.offsetX, event.global.y - dragging.offsetY)
  })
  app.stage.on('pointerup', () => { dragging = null })
  app.stage.on('pointerupoutside', () => { dragging = null })

  app.ticker.add((ticker) => {
    if (props.mode === 'run') runStep(ticker.deltaMS / 1000)
  })

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  render()
})

function onKeyDown(event: KeyboardEvent) {
  keys.add(event.key.toLowerCase())
  if (event.key.startsWith('Arrow')) event.preventDefault()
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.key.toLowerCase())
}

watch(() => props.mode, (mode) => {
  activeContacts.clear()
  runtimeProject = mode === 'run' ? structuredClone(props.project) : null
  render()
})

watch(() => props.project, () => {
  if (props.mode === 'edit') render()
}, { deep: true })

watch(() => props.selectedId, render)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  app?.destroy(true)
  app = null
})
</script>

<template>
  <div ref="host" class="world-canvas" />
</template>
