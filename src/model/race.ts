import { cloneData } from './clone'
import type { CreatiBoxProject, Entity, MovementStyle, ProjectViewPreferences, ProjectViewState, RaceCapability, RaceParticipant, RaceSpecies } from './types'

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
  const normalizedView = normalizeProjectView((project as CreatiBoxProject).view)
  if (normalizedView) project.view = normalizedView
  else delete project.view
  for (const entity of project.world.entities) {
    // First-phase animals and Human are self-contained participants. Remove the
    // accidental car-driver field written by the first Unified Race release.
    if (RACE_SPECIES.includes(entity.kind as RaceSpecies) && entity.kind !== 'car') {
      delete entity.driverPreset
    }
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

const DEFAULT_EDIT_PROJECT_VIEW: ProjectViewState = {
  viewMode: 'top-down', cameraTarget: null, zoom: 1, rotation: 0, followMode: 'none',
}
const DEFAULT_RUN_PROJECT_VIEW: ProjectViewState = {
  viewMode: 'top-down', cameraTarget: null, zoom: 1, rotation: 0, followMode: 'participant',
}

function finiteOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSavedView(value: unknown, scope: 'edit' | 'run'): ProjectViewState {
  const raw = value && typeof value === 'object' ? value as Partial<ProjectViewState> : {}
  const defaults = scope === 'edit' ? DEFAULT_EDIT_PROJECT_VIEW : DEFAULT_RUN_PROJECT_VIEW
  const supportedMode = scope === 'run' && raw.viewMode === 'oblique' ? 'oblique' : 'top-down'
  const state: ProjectViewState = {
    viewMode: supportedMode,
    cameraTarget: typeof raw.cameraTarget === 'string' || raw.cameraTarget === null ? raw.cameraTarget : defaults.cameraTarget,
    zoom: Math.min(2, Math.max(0.5, finiteOr(raw.zoom, defaults.zoom))),
    rotation: finiteOr(raw.rotation, defaults.rotation),
    followMode: scope === 'run' && raw.followMode === 'participant' ? 'participant' : 'none',
  }
  if (typeof raw.pitch === 'number' && Number.isFinite(raw.pitch)) state.pitch = raw.pitch
  if (typeof raw.elevation === 'number' && Number.isFinite(raw.elevation)) state.elevation = raw.elevation
  return state
}

export function normalizeProjectView(value: unknown): ProjectViewPreferences | undefined {
  if (value === undefined) return undefined
  const raw = value && typeof value === 'object' ? value as { version?: unknown; edit?: unknown; run?: unknown } : {}
  if (raw.version !== 1) {
    return { version: 1, edit: { ...DEFAULT_EDIT_PROJECT_VIEW }, run: { ...DEFAULT_RUN_PROJECT_VIEW } }
  }
  return { version: 1, edit: normalizeSavedView(raw.edit, 'edit'), run: normalizeSavedView(raw.run, 'run') }
}

export function createProjectViewPreferences(runMode: 'top-down' | 'oblique'): ProjectViewPreferences {
  return {
    version: 1,
    edit: { ...DEFAULT_EDIT_PROJECT_VIEW },
    run: { ...DEFAULT_RUN_PROJECT_VIEW, viewMode: runMode },
  }
}
export function validateRaceCapability(entity: Entity) {
  if (!entity.race) return
  if (typeof entity.race.enabled !== 'boolean') throw new Error(`${entity.name}: race.enabled 必须是布尔值`)
  for (const field of ['maxSpeed', 'acceleration', 'brakePower', 'turnRate'] as const) {
    if (!Number.isFinite(entity.race[field]) || entity.race[field] <= 0) throw new Error(`${entity.name}: race.${field} 必须是有限正数`)
  }
  if (!['vehicle', 'runner', 'hoofed'].includes(entity.movementStyle ?? '')) throw new Error(`${entity.name}: movementStyle 无效`)
}
