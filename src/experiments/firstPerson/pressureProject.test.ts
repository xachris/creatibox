import { describe, expect, it } from 'vitest'
import { isRaceParticipant } from '../../model/race'
import { createFirstPersonPressureProject } from './pressureProject'

describe('first-person WebGL pressure fixture', () => {
  it.each([500, 1000] as const)('creates %i ordinary static entities around one authoritative player', count => {
    const project = createFirstPersonPressureProject(count)
    const pressure = project.world.entities.filter(entity => entity.id.startsWith('pressure-'))
    const players = project.world.entities.filter(entity => isRaceParticipant(entity) && entity.controlRole === 'player')
    expect(pressure).toHaveLength(count)
    expect(new Set(pressure.map(entity => entity.id)).size).toBe(count)
    expect(new Set(pressure.map(entity => entity.kind))).toEqual(new Set(['tree', 'wall', 'obstacle']))
    expect(players).toHaveLength(1)
    expect(project.world.trackPath).toEqual([{ x: 260, y: 600 }, { x: 1500, y: 600 }])
  })
})
