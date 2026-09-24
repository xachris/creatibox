import { expect, it } from 'vitest'
import { createStarterProject } from './factory'
import { normalizeProject, validateRaceCapability } from './race'
it('migrates legacy speed, preserves authoring and is idempotent', () => {
  const original = createStarterProject()
  const car = original.world.entities.find(e => e.kind === 'car')!
  delete car.race
  car.maxSpeed = 317
  const migrated = normalizeProject(original)
  expect(migrated.world.entities.find(e => e.kind === 'car')!.race!.maxSpeed).toBe(317)
  expect(car.race).toBeUndefined()
  expect(normalizeProject(migrated)).toEqual(migrated)
  expect(migrated.world.rules).toEqual(original.world.rules)
})
it('preserves explicit disabled and rejects invalid capability numbers', () => {
  const project = normalizeProject(createStarterProject())
  const car = project.world.entities.find(e => e.kind === 'car')!
  car.race!.enabled = false
  expect(normalizeProject(project).world.entities.find(e => e.kind === 'car')!.race!.enabled).toBe(false)
  car.race!.maxSpeed = NaN
  expect(() => validateRaceCapability(car)).toThrow('maxSpeed')
})
it('round trips mixed capabilities, controls, appearance and audio through import', async () => {
  const { createRaceProject } = await import('./raceGenerator')
  const { importProject } = await import('../storage/projectStorage')
  const p = createRaceProject({ playerKind:'horse', opponentKinds:['car','human','sheep'], track:'curve', length:2, carShape:'boxy',color:'blue',motion:'dynamic',sound:'electric',opponents:3,difficulty:'fast' })
  p.world.entities[0].controls!.accelerate='w'
  p.world.entities[0].race!.maxSpeed=213
  const imported=await importProject({text:async()=>JSON.stringify(p)} as File)
  expect(imported).toEqual(p)
  expect(normalizeProject(imported)).toEqual(p)
})
