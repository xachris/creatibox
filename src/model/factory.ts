import { RACE_DEFAULTS, RACE_SPECIES, normalizeProject } from './race'
import { cloneData } from './clone'
import type {
  CarShape,
  ControlRole,
  ControlScheme,
  CreatiBoxProject,
  Entity,
  EntityKind,
  MotionPreset,
  OpponentProfile,
  SoundPreset,
  RaceSpecies,
} from './types'

const defaults: Record<EntityKind, Pick<Entity, 'size' | 'color' | 'movable' | 'durability' | 'maxDurability' | 'maxSpeed'>> = {
  car: { size: { x: 72, y: 42 }, color: 0xb91c1c, movable: true, durability: 100, maxDurability: 100, maxSpeed: 260 },
  // Race participant sizes are SAT collision bodies. Keep them large enough to
  // contain the full vector silhouette so bodies never appear to overlap.
  horse: { size: { x: 92, y: 52 }, color: 0x996633, movable: true, durability: 100, maxDurability: 100, maxSpeed: 205 },
  human: { size: { x: 54, y: 44 }, color: 0x2563eb, movable: true, durability: 100, maxDurability: 100, maxSpeed: 125 },
  sheep: { size: { x: 62, y: 50 }, color: 0xf5f5dc, movable: true, durability: 100, maxDurability: 100, maxSpeed: 95 },
  road: { size: { x: 240, y: 96 }, color: 0x475569, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
  wall: { size: { x: 120, y: 28 }, color: 0x334155, movable: false, durability: 100, maxDurability: 100, maxSpeed: 0 },
  obstacle: { size: { x: 54, y: 54 }, color: 0xf59e0b, movable: false, durability: 80, maxDurability: 80, maxSpeed: 0 },
  tree: { size: { x: 46, y: 70 }, color: 0x15803d, movable: false, durability: 120, maxDurability: 120, maxSpeed: 0 },
  start: { size: { x: 110, y: 18 }, color: 0x2563eb, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
  finish: { size: { x: 110, y: 18 }, color: 0x16a34a, movable: false, durability: 9999, maxDurability: 9999, maxSpeed: 0 },
}

export const DEFAULT_CAR_CONTROLS: ControlScheme = {
  accelerate: 'arrowup',
  brake: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  primary: ' ',
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
  controlRole?: ControlRole
  motionPreset?: MotionPreset
  soundPreset?: SoundPreset
  opponentProfile?: OpponentProfile
}

export function createEntity(kind: EntityKind, x = 120, y = 120): Entity {
  const base = defaults[kind]
  const preset = RACE_SPECIES.includes(kind as RaceSpecies) ? RACE_DEFAULTS[kind as RaceSpecies] : undefined
  const race = preset ? { enabled: preset.enabled, maxSpeed: preset.maxSpeed, acceleration: preset.acceleration, brakePower: preset.brakePower, turnRate: preset.turnRate } : undefined
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
    race,
    movementStyle: preset?.movementStyle,
    controls: preset ? { ...DEFAULT_CAR_CONTROLS } : undefined,
    controlRole: preset ? 'player' : undefined,
    wheelCount: kind === 'car' ? 4 : undefined,
    carShape: kind === 'car' ? 'classic' : undefined,
    motionPreset: preset ? 'clean' : undefined,
    soundPreset: kind === 'car' ? 'light' : undefined,
    waypointIndex: preset ? 1 : undefined,
  }
}

const RANDOM_CAR_COLORS = [0xb91c1c, 0x2563eb, 0xf59e0b]
const RANDOM_CAR_SHAPES: CarShape[] = ['classic', 'sport', 'boxy']

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomStep(min: number, max: number, step: number): number {
  const count = Math.floor((max - min) / step)
  return min + Math.floor(Math.random() * (count + 1)) * step
}

export function createCar(options: CarOptions = {}, x = 180, y = 180): Entity {
  const car = createEntity('car', x, y)
  car.name = options.name?.trim() || 'My Car'
  car.color = options.color ?? car.color
  car.size = {
    x: Math.max(44, Math.min(150, options.width ?? car.size.x)),
    y: Math.max(28, Math.min(100, options.height ?? car.size.y)),
  }
  car.maxSpeed = Math.max(80, Math.min(420, options.maxSpeed ?? car.maxSpeed))
  car.race!.maxSpeed = car.maxSpeed
  car.wheelCount = Math.max(2, Math.min(8, options.wheelCount ?? 4))
  car.carShape = options.carShape ?? 'classic'
  car.controls = { ...(options.controls ?? DEFAULT_CAR_CONTROLS) }
  car.controlRole = options.controlRole ?? 'player'
  car.motionPreset = options.motionPreset ?? 'clean'
  car.soundPreset = options.soundPreset ?? 'light'
  car.opponentProfile = options.opponentProfile
  car.waypointIndex = 1
  return car
}

export function createRandomCar(x = 180, y = 180): Entity {
  return createCar({
    name: `Random Car ${Math.floor(Math.random() * 900 + 100)}`,
    color: pick(RANDOM_CAR_COLORS),
    width: randomStep(56, 112, 8),
    height: randomStep(30, 70, 4),
    maxSpeed: randomStep(160, 320, 20),
    wheelCount: pick([2, 4, 4, 6]),
    carShape: pick(RANDOM_CAR_SHAPES),
    controls: { ...DEFAULT_CAR_CONTROLS },
    controlRole: 'player',
    motionPreset: pick(['clean', 'dynamic']),
    soundPreset: pick(['light', 'sport', 'electric']),
  }, x, y)
}

export function createStarterProject(): CreatiBoxProject {
  const car = createCar({}, 180, 220)
  return {
    formatVersion: '0.1',
    name: 'My Racing World',
    world: {
      id: crypto.randomUUID(),
      name: 'World 1',
      entities: [
        createEntity('road', 280, 220),
        car,
        createEntity('wall', 470, 160),
        createEntity('tree', 430, 300),
        { ...createEntity('finish', 900, 220), rotation: Math.PI / 2, size: { x: 170, y: 18 } },
      ],
      rules: [
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'wall', effect: 'damage', value: 25 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'obstacle', effect: 'damage', value: 20 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'car', effect: 'damage', value: 4 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'reach', targetKind: 'finish', effect: 'finish' },
      ],
      trackPreset: 'straight',
      trackLength: 1,
      trackPath: [{ x: 180, y: 220 }, { x: 900, y: 220 }],
      worldBounds: { width: 1200, height: 700 },
    },
  }
}

export function cloneProject(project: CreatiBoxProject): CreatiBoxProject {
  return normalizeProject(cloneData(project))
}

export function createParticipant(kind: RaceSpecies, options: CarOptions = {}, x = 180, y = 180): Entity {
  if (kind === 'car') return createCar(options, x, y)
  const entity = createEntity(kind, x, y)
  entity.name = options.name?.trim() || kind[0].toUpperCase() + kind.slice(1)
  entity.controlRole = options.controlRole ?? 'player'
  entity.controls = { ...(options.controls ?? DEFAULT_CAR_CONTROLS) }
  entity.opponentProfile = options.opponentProfile
  entity.motionPreset = options.motionPreset ?? 'clean'
  entity.soundPreset = options.soundPreset ?? 'light'
  entity.race!.maxSpeed = options.maxSpeed ?? RACE_DEFAULTS[kind].maxSpeed
  return entity
}
