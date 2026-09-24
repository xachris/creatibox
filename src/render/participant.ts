import type { Graphics } from 'pixi.js'
import type { Entity } from '../model/types'

/** Visual proportions are independent of the SAT body. Distance freezes at rest. */
export function drawLivingParticipant(g: Graphics, e: Entity, distance: number) {
  if (!['horse', 'human', 'sheep'].includes(e.kind)) return false
  const moving = e.speed > 0 && e.state !== 'Finished' && e.state !== 'Broken'
  const stride = moving ? Math.sin(distance / (e.kind === 'sheep' ? 9 : e.movementStyle === 'runner' ? 10 : 16)) : 0
  const amplitude = e.motionPreset === 'dynamic' ? 7 : 4
  const swing = stride * amplitude
  const dark = 0x3f3027
  if (e.kind === 'human') {
    // Two legs, torso, arms and a forward-facing head.
    g.moveTo(-4, -5).lineTo(-19 + swing, -10).moveTo(-4, 5).lineTo(-19 - swing, 10).stroke({ width: 5, color: 0x24324b, cap: 'round' })
    g.moveTo(4, -6).lineTo(-4 - swing, -16).moveTo(4, 6).lineTo(-4 + swing, 16).stroke({ width: 4, color: 0xe9b994, cap: 'round' })
    g.roundRect(-8, -8, 19, 16, 6).fill(e.color)
    g.circle(14, 0, 8).fill(0xe9b994).circle(16, -3, 1.4).fill(dark)
  } else {
    const sheep = e.kind === 'sheep'
    const length = sheep ? 30 : 48
    for (const x of [-length * .35, length * .3]) for (const side of [-1, 1]) {
      const phase = (x > 0 ? 1 : -1) * side
      g.moveTo(x, side * 8).lineTo(x + swing * phase, side * (sheep ? 20 : 23)).stroke({ width: sheep ? 4 : 5, color: dark, cap: 'round' })
    }
    if (sheep) {
      for (const x of [-12, 0, 12]) for (const y of [-7, 7]) g.circle(x, y, 10).fill(0xfaf5e7)
      g.circle(0, 0, 13).fill(0xffffff)
      g.roundRect(15, -7, 19, 14, 6).fill(0x64564b)
      g.circle(19, -10, 4).fill(0x64564b).circle(19, 10, 4).fill(0x64564b)
    } else {
      g.roundRect(-25, -12, 47, 24, 11).fill(e.color)
      g.moveTo(-24, 0).lineTo(-38, swing * .5).stroke({ width: 5, color: dark, cap: 'round' })
      g.roundRect(13, -8, 21, 16, 5).fill(e.color)
      g.roundRect(27, -7, 19, 14, 5).fill(0xb48054)
      g.poly([25, -5, 23, -17, 31, -7]).fill(dark)
      g.moveTo(12, -7).lineTo(25, -8).stroke({ width: 5, color: dark })
    }
    g.circle(sheep ? 28 : 38, -3, 1.7).fill(0x111827)
  }
  g.alpha = e.state === 'Broken' ? .42 : 1
  return true
}
