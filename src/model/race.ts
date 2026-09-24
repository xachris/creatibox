import { cloneData } from './clone'
import type { CreatiBoxProject, Entity, MovementStyle, RaceCapability, RaceParticipant, RaceSpecies } from './types'

export const RACE_SPECIES: RaceSpecies[] = ['car', 'horse', 'human', 'sheep']
export const RACE_DEFAULTS: Record<RaceSpecies, RaceCapability & { movementStyle: MovementStyle }> = {
  car: { enabled: true, maxSpeed: 260, acceleration: 165, brakePower: 250, turnRate: 2.4, movementStyle: 'vehicle' },
  horse: { enabled: true, maxSpeed: 205, acceleration: 145, brakePower: 260, turnRate: 2.6, movementStyle: 'hoofed' },
  human: { enabled: true, maxSpeed: 125, acceleration: 210, brakePower: 420, turnRate: 4, movementStyle: 'runner' },
  sheep: { enabled: true, maxSpeed: 95, acceleration: 120, brakePower: 230, turnRate: 2.8, movementStyle: 'hoofed' },
}
export function isRaceParticipant(entity: Entity): entity is RaceParticipant {
  return entity.race?.enabled === true
}
export function normalizeProject(source: CreatiBoxProject): CreatiBoxProject {
  const project = cloneData(source)
  for (const entity of project.world.entities) {
    if (entity.kind === 'car' && entity.race === undefined) {
      const { movementStyle, ...race } = RACE_DEFAULTS.car
      entity.race = { ...race, maxSpeed: entity.maxSpeed ?? race.maxSpeed }
      entity.movementStyle ??= movementStyle
      entity.controlRole ??= 'player'
    }
    if (entity.race && entity.movementStyle === undefined) {
      entity.movementStyle = RACE_DEFAULTS[entity.kind as RaceSpecies]?.movementStyle ?? 'vehicle'
    }
  }
  return project
}
export function validateRaceCapability(entity: Entity) {
  if (!entity.race) return
  if (typeof entity.race.enabled !== 'boolean') throw new Error(`${entity.name}: race.enabled 必须是布尔值`)
  for (const field of ['maxSpeed', 'acceleration', 'brakePower', 'turnRate'] as const) {
    if (!Number.isFinite(entity.race[field]) || entity.race[field] <= 0) throw new Error(`${entity.name}: race.${field} 必须是有限正数`)
  }
  if (!['vehicle', 'runner', 'hoofed'].includes(entity.movementStyle ?? '')) throw new Error(`${entity.name}: movementStyle 无效`)
}
