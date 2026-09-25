import { isRaceParticipant } from '../../model/race'
import { createEntity } from '../../model/factory'
import { createRaceProject } from '../../model/raceGenerator'
import type { CreatiBoxProject, EntityKind } from '../../model/types'

export type FirstPersonPressureCount = 500 | 1000

/** Development-only display fixture. It uses ordinary Entities and no second runtime. */
export function createFirstPersonPressureProject(count: FirstPersonPressureCount): CreatiBoxProject {
  const project = createRaceProject({
    playerKind: 'car', opponentKinds: [], track: 'straight', length: 1,
    carShape: 'sport', color: 'blue', motion: 'clean', sound: 'electric', opponents: 0, difficulty: 'normal',
  })
  const player = project.world.entities.find(entity => isRaceParticipant(entity) && entity.controlRole === 'player')!
  player.position = { x: 260, y: 600 }
  player.rotation = 0
  const markers = project.world.entities.filter(entity => entity.kind === 'start' || entity.kind === 'finish')
  const kinds: EntityKind[] = ['tree', 'wall', 'obstacle']
  const columns = 40
  const scenery = Array.from({ length: count }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const kind = kinds[index % kinds.length]
    const entity = createEntity(kind, 360 + column * 24, 300 + row * 24)
    entity.id = `pressure-${count}-${index}`
    entity.name = `Pressure ${kind} ${index + 1}`
    entity.rotation = (index % 8) * Math.PI / 4
    if (kind === 'tree') entity.color = index % 2 ? 0x15803d : 0x4d7c0f
    return entity
  })
  project.name = `First-Person ${count} Entity Pressure`
  project.world.name = `${count} Static Entity WebGL Fixture`
  project.world.entities = [player, ...markers, ...scenery]
  project.world.trackPath = [{ x: 260, y: 600 }, { x: 1500, y: 600 }]
  project.world.worldBounds = { width: 1700, height: 1200 }
  return project
}
