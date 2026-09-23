<script setup lang="ts">
import { Application, Container, FederatedPointerEvent, Graphics } from 'pixi.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CreatiBoxProject, Entity, Vec2 } from '../model/types'
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
let worldLayer: Container | null = null
let runtimeProject: CreatiBoxProject | null = null
let dragging: { id: string; offsetX: number; offsetY: number } | null = null
const keys = new Set<string>()
const activeContacts = new Set<string>()

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

function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
}

function updateComputerCar(car: Entity, path: Vec2[], dt: number) {
  if (path.length < 2 || car.state === 'Finished' || car.state === 'Broken') return
  const index = Math.min(car.waypointIndex ?? 1, path.length - 1)
  const target = path[index]
  const dx = target.x - car.position.x
  const dy = target.y - car.position.y
  const distance = Math.hypot(dx, dy)

  if (distance < 90 && index < path.length - 1) {
    car.waypointIndex = index + 1
    return
  }

  const desired = Math.atan2(dy, dx)
  const delta = normalizeAngle(desired - car.rotation)
  const turnRate = car.opponentProfile === 'easy' ? 1.65 : car.opponentProfile === 'fast' ? 2.65 : 2.15
  car.rotation += Math.max(-turnRate * dt, Math.min(turnRate * dt, delta))

  const acceleration = car.opponentProfile === 'easy' ? 105 : car.opponentProfile === 'fast' ? 155 : 130
  car.speed = Math.min(car.maxSpeed, car.speed + acceleration * dt)
  car.position.x += Math.cos(car.rotation) * car.speed * dt
  car.position.y += Math.sin(car.rotation) * car.speed * dt
  car.state = 'Moving'

  if (index === path.length - 1 && distance < 75) {
    car.state = 'Finished'
    car.speed = 0
  }
}

function updatePlayerCar(car: Entity, dt: number) {
  if (car.state === 'Broken' || car.state === 'Finished') return

  const controls = car.controls ?? {
    accelerate: 'arrowup',
    brake: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    primary: ' ',
  }

  const forward = keys.has(controls.accelerate.toLowerCase())
  const primary = controls.primary ? keys.has(controls.primary.toLowerCase()) : false
  const braking = keys.has(controls.brake.toLowerCase())
  const left = keys.has(controls.left.toLowerCase())
  const right = keys.has(controls.right.toLowerCase())

  if (forward || primary) car.speed = Math.min(car.maxSpeed, car.speed + (primary ? 210 : 165) * dt)
  else car.speed = Math.max(0, car.speed - 60 * dt)

  if (braking) car.speed = Math.max(0, car.speed - 250 * dt)

  const turn = (right ? 1 : 0) - (left ? 1 : 0)
  car.rotation += turn * 2.4 * dt * Math.max(0.25, car.speed / Math.max(car.maxSpeed, 1))

  if (car.speed > 0) {
    car.state = 'Moving'
    car.position.x += Math.cos(car.rotation) * car.speed * dt
    car.position.y += Math.sin(car.rotation) * car.speed * dt
  } else if (car.state === 'Moving') {
    car.state = 'Idle'
  }
}

function processCollisions(car: Entity, worldEntities: Entity[], rules: CreatiBoxProject['world']['rules']) {
  for (const target of worldEntities) {
    if (target.id === car.id || target.kind === 'road' || target.kind === 'start' || target.kind === 'tree') continue
    const key = `${car.id}:${target.id}`
    const touching = intersects(car, target)
    if (touching && !activeContacts.has(key)) {
      activeContacts.add(key)
      const rule = matchingRule(rules, car, target)
      if (rule) applyInteractionRule(car, target, rule)
      if (target.kind !== 'finish' && target.kind !== 'car') {
        car.speed *= 0.42
        car.position.x -= Math.cos(car.rotation) * 12
        car.position.y -= Math.sin(car.rotation) * 12
      }
    } else if (!touching) {
      activeContacts.delete(key)
    }
  }
}

function followPlayer(player: Entity) {
  if (!app || !worldLayer) return
  worldLayer.position.set(
    app.screen.width / 2 - player.position.x,
    app.screen.height / 2 - player.position.y,
  )
}

function runStep(deltaSeconds: number) {
  if (!runtimeProject) return
  const world = runtimeProject.world
  const path = world.trackPath ?? []

  const player = world.entities.find((entity) => entity.kind === 'car' && entity.controlRole !== 'computer')
  if (player) {
    updatePlayerCar(player, deltaSeconds)
    processCollisions(player, world.entities, world.rules)
    followPlayer(player)
  }

  for (const car of world.entities.filter((entity) => entity.kind === 'car' && entity.controlRole === 'computer')) {
    updateComputerCar(car, path, deltaSeconds)
    processCollisions(car, world.entities, world.rules)
  }

  render()
}

onMounted(async () => {
  if (!host.value) return
  app = new Application()
  await app.init({
    background: '#dbe7cf',
    antialias: true,
    resizeTo: host.value,
  })
  host.value.appendChild(app.canvas)

  worldLayer = new Container()
  app.stage.addChild(worldLayer)
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen

  app.stage.on('pointerdown', () => emit('select', null))
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
  render()
})

function onKeyDown(event: KeyboardEvent) {
  keys.add(event.key.toLowerCase())
  if (event.key.startsWith('Arrow') || event.key === ' ') event.preventDefault()
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.key.toLowerCase())
}

watch(() => props.mode, (mode) => {
  activeContacts.clear()
  runtimeProject = mode === 'run' ? structuredClone(props.project) : null
  if (worldLayer) worldLayer.position.set(0, 0)
  if (mode === 'run' && runtimeProject) {
    const player = runtimeProject.world.entities.find((entity) => entity.kind === 'car' && entity.controlRole !== 'computer')
    if (player) followPlayer(player)
  }
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
  worldLayer = null
})
</script>

<template>
  <div ref="host" class="world-canvas" />
</template>
