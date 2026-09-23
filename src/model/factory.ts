import type { CarShape, ControlScheme, CreatiBoxProject, Entity, EntityKind } from './types'

const defaults: Record<EntityKind, Pick<Entity, 'size' | 'color' | 'movable' | 'durability' | 'maxDurability' | 'maxSpeed'>> = {
  car: { size: { x: 72, y: 42 }, color: 0xb91c1c, movable: true, durability: 100, maxDurability: 100, maxSpeed: 220 },
  road: { size: { x: 240, y: 96 }, color: 0x475569, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
  wall: { size: { x: 120, y: 28 }, color: 0x334155, movable: false, durability: 100, maxDurability: 100, maxSpeed: 0 },
  obstacle: { size: { x: 54, y: 54 }, color: 0xf59e0b, movable: false, durability: 80, maxDurability: 80, maxSpeed: 0 },
  start: { size: { x: 100, y: 18 }, color: 0x2563eb, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
  finish: { size: { x: 100, y: 18 }, color: 0x16a34a, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
}

export const DEFAULT_CAR_CONTROLS: ControlScheme = {
  accelerate: 'w',
  brake: 's',
  left: 'a',
  right: 'd',
}

export interface CarOptions {
  name?: string
  color?: number
  width?: number
  height?: number
  maxSpeed?: number
  wheelCount?: number
  carShape?: CarShape
  controls?: ControlScheme
}

export function createEntity(kind: EntityKind, x = 120, y = 120): Entity {
  const base = defaults[kind]
  return {
    id: crypto.randomUUID(),
    kind,
    name: kind[0].toUpperCase() + kind.slice(1),
    position: { x, y },
    size: { ...base.size },
    rotation: 0,
    color: base.color,
    movable: base.movable,
    state: 'Idle',
    durability: base.durability,
    maxDurability: base.maxDurability,
    speed: 0,
    maxSpeed: base.maxSpeed,
    controls: kind === 'car' ? { ...DEFAULT_CAR_CONTROLS } : undefined,
    wheelCount: kind === 'car' ? 4 : undefined,
    carShape: kind === 'car' ? 'classic' : undefined,
  }
}

export function createCar(options: CarOptions, x = 180, y = 180): Entity {
  const car = createEntity('car', x, y)
  car.name = options.name?.trim() || 'My Car'
  car.color = options.color ?? car.color
  car.size = {
    x: Math.max(44, Math.min(150, options.width ?? car.size.x)),
    y: Math.max(28, Math.min(100, options.height ?? car.size.y)),
  }
  car.maxSpeed = Math.max(80, Math.min(420, options.maxSpeed ?? car.maxSpeed))
  car.wheelCount = Math.max(2, Math.min(8, options.wheelCount ?? 4))
  car.carShape = options.carShape ?? 'classic'
  car.controls = { ...(options.controls ?? DEFAULT_CAR_CONTROLS) }
  return car
}

export function createStarterProject(): CreatiBoxProject {
  return {
    formatVersion: '0.1',
    name: 'My Racing World',
    world: {
      id: crypto.randomUUID(),
      name: 'World 1',
      entities: [
        createEntity('road', 280, 220),
        createEntity('car', 180, 220),
        createEntity('wall', 470, 160),
        createEntity('finish', 500, 300),
      ],
      rules: [
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'wall', effect: 'damage', value: 25 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'obstacle', effect: 'damage', value: 20 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'reach', targetKind: 'finish', effect: 'finish' },
      ],
    },
  }
}

export function cloneProject(project: CreatiBoxProject): CreatiBoxProject {
  return structuredClone(project)
}
