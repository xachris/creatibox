export type EntityKind = 'car' | 'road' | 'wall' | 'obstacle' | 'start' | 'finish'
export type EntityState = 'Idle' | 'Moving' | 'Damaged' | 'Broken' | 'Finished'
export type CarShape = 'classic' | 'sport' | 'boxy'

export interface Vec2 {
  x: number
  y: number
}

export interface ControlScheme {
  accelerate: string
  brake: string
  left: string
  right: string
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
  controls?: ControlScheme
  wheelCount?: number
  carShape?: CarShape
}

export interface Rule {
  id: string
  sourceKind: EntityKind
  interaction: 'collide' | 'reach'
  targetKind: EntityKind
  effect: 'damage' | 'finish'
  value?: number
}

export interface World {
  id: string
  name: string
  entities: Entity[]
  rules: Rule[]
}

export interface CreatiBoxProject {
  formatVersion: '0.1'
  name: string
  world: World
}
