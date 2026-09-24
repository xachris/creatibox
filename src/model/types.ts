export type RaceSpecies = 'car' | 'horse' | 'human' | 'sheep'
export type MovementStyle = 'vehicle' | 'runner' | 'hoofed'
export interface RaceCapability {
  enabled: boolean
  maxSpeed: number
  acceleration: number
  brakePower: number
  turnRate: number
}
export type RaceParticipant = Entity & { race: RaceCapability }
export type EntityKind = 'car' | 'horse' | 'human' | 'sheep' | 'road' | 'wall' | 'obstacle' | 'tree' | 'start' | 'finish'
export type EntityState = 'Idle' | 'Moving' | 'Damaged' | 'Broken' | 'Finished'
export type CarShape = 'classic' | 'sport' | 'boxy'
export type ControlRole = 'player' | 'computer'
export type TrackPreset = 'straight' | 'curve' | 'circuit'
export type TrackLength = 1 | 2
export type MotionPreset = 'clean' | 'dynamic'
export type SoundPreset = 'light' | 'sport' | 'electric'
export type OpponentProfile = 'easy' | 'normal' | 'fast'

export interface Vec2 {
  x: number
  y: number
}

export interface ControlScheme {
  accelerate: string
  brake: string
  left: string
  right: string
  primary?: string
}

export interface Entity {
  id: string
  kind: EntityKind
  name: string
  position: Vec2
  size: Vec2
  rotation: number
  color: number
  movable: boolean
  state: EntityState
  durability: number
  maxDurability: number
  speed: number
  maxSpeed: number
  race?: RaceCapability
  movementStyle?: MovementStyle
  controls?: ControlScheme
  controlRole?: ControlRole
  wheelCount?: number
  carShape?: CarShape
  motionPreset?: MotionPreset
  soundPreset?: SoundPreset
  opponentProfile?: OpponentProfile
  waypointIndex?: number
  driverPreset?: 'driver-a' | 'driver-b' | 'driver-c'
}

export interface Rule {
  id: string
  sourceKind?: EntityKind
  sourceCapability?: 'race'
  interaction: 'collide' | 'reach'
  targetKind?: EntityKind
  targetCapability?: 'race'
  effect: 'damage' | 'finish'
  value?: number
}

export interface World {
  id: string
  name: string
  entities: Entity[]
  rules: Rule[]
  trackPreset?: TrackPreset
  trackLength?: TrackLength
  trackPath?: Vec2[]
  worldBounds?: { width: number; height: number }
}

export interface CreatiBoxProject {
  formatVersion: '0.1'
  name: string
  world: World
}
