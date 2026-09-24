import { describe, expect, it } from 'vitest'
import type { Entity } from '../model/types'
import { selectHorseFrame } from './horseAtlas'

function horse(rotation: number, speed = 50, state: Entity['state'] = 'Moving') {
  return { rotation, speed, state }
}

describe('horse oblique atlas mapping', () => {
  it('maps a full turn to authored directions and mirrored counterparts', () => {
    const frames = Array.from({ length: 8 }, (_, index) => selectHorseFrame(horse(index * Math.PI / 4), 0))
    expect(frames.map(frame => [frame.direction, frame.mirrored])).toEqual([
      ['frontRight', false], ['frontRight', false], ['frontRight', true], ['right', true],
      ['backRight', true], ['back', false], ['backRight', false], ['right', false],
    ])
  })

  it('keeps idle on column zero and advances a stable four-frame run loop', () => {
    expect(selectHorseFrame(horse(0, 0, 'Idle'), 100).column).toBe(0)
    expect([0, 18, 36, 54, 72].map(distance => selectHorseFrame(horse(0), distance).column)).toEqual([1, 2, 3, 4, 1])
    expect(selectHorseFrame(horse(0, 50, 'Finished'), 54).column).toBe(0)
  })
})
