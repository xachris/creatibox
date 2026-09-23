import { createCar, createEntity, DEFAULT_CAR_CONTROLS } from './factory'
import type {
  CarShape,
  CreatiBoxProject,
  MotionPreset,
  OpponentProfile,
  SoundPreset,
  TrackLength,
  TrackPreset,
  Vec2,
} from './types'

export interface RacePresetOptions {
  driver?: 'driver-a' | 'driver-b' | 'driver-c'
  track: TrackPreset
  length: TrackLength
  carShape: CarShape
  color: 'red' | 'blue' | 'yellow'
  motion: MotionPreset
  sound: SoundPreset
  opponents: 0 | 1 | 2 | 3
  difficulty: OpponentProfile
}

const COLORS = {
  red: 0xb91c1c,
  blue: 0x2563eb,
  yellow: 0xf59e0b,
}

const OPPONENT_COLORS = [0x2563eb, 0xf59e0b, 0x7c3aed]

function trackPath(track: TrackPreset, length: TrackLength): { path: Vec2[]; bounds: { width: number; height: number } } {
  const scale = length === 2 ? 1.65 : 1

  if (track === 'curve') {
    return {
      path: [
        { x: 350, y: 500 },
        { x: 850 * scale, y: 500 },
        { x: 1300 * scale, y: 420 },
        { x: 1700 * scale, y: 250 },
        { x: 2150 * scale, y: 300 },
        { x: 2600 * scale, y: 520 },
        { x: 3150 * scale, y: 520 },
      ],
      bounds: { width: 3500 * scale, height: 1000 },
    }
  }

  if (track === 'circuit') {
    const w = 2500 * scale
    const h = 1100
    return {
      path: [
        { x: 450, y: 700 },
        { x: w - 450, y: 700 },
        { x: w - 250, y: 500 },
        { x: w - 450, y: 250 },
        { x: 550, y: 250 },
        { x: 280, y: 450 },
        { x: 450, y: 700 },
      ],
      bounds: { width: w, height: h },
    }
  }

  return {
    path: [
      { x: 350, y: 500 },
      { x: 1100 * scale, y: 500 },
      { x: 1900 * scale, y: 500 },
      { x: 2800 * scale, y: 500 },
      { x: 3600 * scale, y: 500 },
    ],
    bounds: { width: 4000 * scale, height: 1000 },
  }
}

function angleBetween(a: Vec2, b: Vec2) {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function createRaceProject(options: RacePresetOptions): CreatiBoxProject {
  const { path, bounds } = trackPath(options.track, options.length)
  const start = path[0]
  const next = path[1] ?? path[0]
  const finish = path[path.length - 1]
  const heading = angleBetween(start, next)
  const entities = []

  const player = createCar({
    name: 'Player Car',
    color: COLORS[options.color],
    carShape: options.carShape,
    controls: { ...DEFAULT_CAR_CONTROLS },
    controlRole: 'player',
    motionPreset: options.motion,
    soundPreset: options.sound,
    maxSpeed: 260,
  }, start.x, start.y)
  player.rotation = heading
  player.driverPreset = options.driver ?? 'driver-a'
  entities.push(player)

  for (let i = 0; i < options.opponents; i++) {
    const profileSpeed = options.difficulty === 'easy' ? 190 : options.difficulty === 'fast' ? 280 : 235
    // Stagger far enough (cars are ~72×42) so the grid never starts overlapping.
    const back = 95 + i * 88
    const side = (i % 2 === 0 ? 1 : -1) * (52 + Math.floor(i / 2) * 8)
    const opponent = createCar({
      name: `CPU ${i + 1}`,
      color: OPPONENT_COLORS[i % OPPONENT_COLORS.length],
      carShape: i % 2 === 0 ? 'sport' : 'classic',
      controlRole: 'computer',
      opponentProfile: options.difficulty,
      motionPreset: options.motion,
      soundPreset: options.sound,
      maxSpeed: profileSpeed + i * 8,
    }, start.x - Math.cos(heading) * back + Math.sin(heading) * side,
    start.y - Math.sin(heading) * back - Math.cos(heading) * side)
    opponent.rotation = heading
    entities.push(opponent)
  }

  const startEntity = createEntity('start', start.x - 30, start.y)
  startEntity.rotation = heading + Math.PI / 2
  entities.push(startEntity)

  const finishEntity = createEntity('finish', finish.x, finish.y)
  const prev = path[path.length - 2] ?? finish
  finishEntity.size.x = 170
  finishEntity.rotation = angleBetween(prev, finish) + Math.PI / 2
  entities.push(finishEntity)

  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i]
    if (i % 2 === 0) {
      // Place obstacles beside the outgoing road, never across the AI route.
      const heading = angleBetween(p, path[i + 1])
      const obstacle = createEntity('obstacle', p.x - Math.sin(heading) * 200, p.y + Math.cos(heading) * 200)
      entities.push(obstacle)
    }
  }

  path.forEach((p, index) => {
    if (index % 1 !== 0) return
    for (const side of [-1, 1]) {
      const tree = createEntity('tree', p.x + (index % 2 ? 110 : -70), p.y + side * 170)
      tree.size = { x: 42, y: 64 }
      entities.push(tree)
    }
  })

  return {
    formatVersion: '0.1',
    name: 'Preset Race',
    world: {
      id: crypto.randomUUID(),
      name: options.track === 'straight' ? 'Straight Race' : options.track === 'curve' ? 'Curve Race' : 'Circuit Race',
      entities,
      rules: [
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'obstacle', effect: 'damage', value: 10 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'wall', effect: 'damage', value: 15 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'collide', targetKind: 'car', effect: 'damage', value: 3 },
        { id: crypto.randomUUID(), sourceKind: 'car', interaction: 'reach', targetKind: 'finish', effect: 'finish' },
      ],
      trackPreset: options.track,
      trackLength: options.length,
      trackPath: path,
      worldBounds: bounds,
    },
  }
}
