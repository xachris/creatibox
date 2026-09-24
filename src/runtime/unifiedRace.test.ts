import { expect, it } from 'vitest'
import { createRaceProject, type RacePresetOptions } from '../model/raceGenerator'
import { RACE_SPECIES } from '../model/race'
import type { RaceSpecies } from '../model/types'
import { WorldRuntime, raceStandings } from './worldRuntime'
import { intersects } from './rules'
const base: RacePresetOptions = { track: 'straight', length: 1, carShape: 'sport', color: 'red', motion: 'dynamic', sound: 'sport', opponents: 3, difficulty: 'normal' }
function project(player: RaceSpecies, cpu: RaceSpecies[], options = base) {
  return createRaceProject({ ...options, playerKind: player, opponentKinds: cpu, opponents: cpu.length as 0|1|2|3 })
}
function drive(run: WorldRuntime) {
  const p = run.player, path = run.project.world.trackPath!, target = path[Math.min(p.waypointIndex ?? 1, path.length - 1)]
  let angle = Math.atan2(target.y-p.position.y,target.x-p.position.x)-p.rotation
  angle = Math.atan2(Math.sin(angle),Math.cos(angle))
  const keys = new Set<string>()
  if (Math.abs(angle) > 0.025) keys.add(angle > 0 ? 'arrowright' : 'arrowleft')
  if (Math.abs(angle) > 0.4 && p.speed > 65) keys.add('arrowdown')
  else keys.add('arrowup')
  return keys
}
for (const track of ['straight','curve','circuit'] as const) for (const length of [1,2] as const) for (const difficulty of ['easy','normal','fast'] as const) {
  for (const species of RACE_SPECIES) {
    it(`CPU matrix ${track}/${length}/${difficulty}/${species}`, () => {
      const run = new WorldRuntime(project('car',[species],{...base,track,length,difficulty}))
      const cpu = run.participants[1]
      for (let t=0;t<2400 && cpu.state!=='Finished';t++) run.step(0.1,new Set())
      expect(cpu.state).toBe('Finished')
    })
    it(`mixed input matrix ${track}/${length}/${difficulty}/${species}`, () => {
      const source = project(species,RACE_SPECIES.filter(s=>s!==species),{...base,track,length,difficulty})
      const run = new WorldRuntime(source)
      for(let t=0;t<14400 && run.phase!=='finished';t++) run.step(1/60,drive(run))
      expect(run.player.state).toBe('Finished')
      expect(new Set(run.finishOrder).size).toBe(run.finishOrder.length)
      expect(run.participants.every(p=>p.speed===0)).toBe(true)
      expect(source.world.entities[0].state).toBe('Idle')
    })
  }
}
for(const a of RACE_SPECIES) for(const b of RACE_SPECIES) {
  it(`same/pair ${a} player vs ${b}`,()=>{
    const run=new WorldRuntime(project(a,[b]))
    for(let t=0;t<1200&&run.phase!=='finished';t++)run.step(.1,drive(run))
    expect(run.player.state).toBe('Finished')
  })
}
it('stable ranking, unique player, disabled and non-race exclusion',()=>{
  const p=project('horse',['human','sheep'])
  const run=new WorldRuntime(p)
  for(const e of run.participants){e.position={x:500,y:500};e.waypointIndex=1}
  expect(raceStandings(run).map(e=>e.id)).toEqual(run.participants.map(e=>e.id).sort())
  p.world.entities[1].controlRole='player'
  expect(()=>new WorldRuntime(p)).toThrow('多个玩家')
  p.world.entities[1].race!.enabled=false
  expect(new WorldRuntime(p).participants).toHaveLength(2)
  p.world.entities[0].race!.enabled=false
  expect(()=>new WorldRuntime(p)).toThrow('缺少玩家')
})
it('legacy car-only finish never expands to animal',()=>{
  const p=project('horse',[])
  p.world.rules=[{id:'legacy',sourceKind:'car',targetKind:'finish',interaction:'reach',effect:'finish'}]
  expect(()=>new WorldRuntime(p)).toThrow('完赛规则')
})
for(const count of [0,1,2,3] as const) it(`grid ${count} CPU`,()=>{
 const run=new WorldRuntime(project('horse',RACE_SPECIES.slice(0,count)))
 for(const a of run.participants)for(const b of run.participants)if(a!==b)expect(intersects(a,b)).toBe(false)
})

for (const playerKind of RACE_SPECIES) for (const cpuKind of RACE_SPECIES) {
  it(`separates overlapping live bodies ${playerKind}/${cpuKind}`, () => {
    const run = new WorldRuntime(project(playerKind, [cpuKind]))
    const [player, cpu] = run.participants
    player.position = { x: 500, y: 500 }
    cpu.position = { x: 500, y: 500 }
    player.speed = 0
    cpu.speed = 0
    run.phase = 'racing'
    run.countdown = 0
    run.step(1 / 60, new Set())
    expect(intersects(player, cpu)).toBe(false)
  })
}
