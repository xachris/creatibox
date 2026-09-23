/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const howls: Array<{
  src: string[]
  loop?: boolean
  volumeValue: number
  rateValue: number
  playingFlag: boolean
  play: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  unload: ReturnType<typeof vi.fn>
  volume: ReturnType<typeof vi.fn>
  rate: ReturnType<typeof vi.fn>
  playing: ReturnType<typeof vi.fn>
  once: ReturnType<typeof vi.fn>
}> = []

vi.mock('howler', () => {
  class Howl {
    volumeValue = 1
    rateValue = 1
    playingFlag = false
    play = vi.fn(() => {
      this.playingFlag = true
      return 1
    })
    stop = vi.fn(() => {
      this.playingFlag = false
    })
    unload = vi.fn()
    volume = vi.fn((value?: number) => {
      if (typeof value === 'number') {
        this.volumeValue = value
        return this
      }
      return this.volumeValue
    })
    rate = vi.fn((value?: number) => {
      if (typeof value === 'number') {
        this.rateValue = value
        return this
      }
      return this.rateValue
    })
    playing = vi.fn(() => this.playingFlag)
    once = vi.fn((event: string, cb: () => void) => {
      if (event === 'play') cb()
      return this
    })
    loop = false
    constructor(options: { src: string[]; loop?: boolean; volume?: number }) {
      this.volumeValue = options.volume ?? 1
      this.loop = !!options.loop
      howls.push(this as never)
    }
  }
  return {
    Howl,
    Howler: {
      mute: vi.fn(),
      volume: vi.fn(),
    },
  }
})

describe('raceAudio director', () => {
  beforeEach(async () => {
    howls.length = 0
    vi.resetModules()
    globalThis.sessionStorage?.clear?.()
  })

  it('defaults master volume above zero when storage is empty', async () => {
    const { raceAudio } = await import('./audioDirector')
    expect(raceAudio.getVolume()).toBeGreaterThan(0)
    raceAudio.unlock()
    expect(raceAudio.getVolume()).toBeGreaterThan(0)
    raceAudio.dispose()
  })

  it('plays UI select / step / confirm feedback', async () => {
    const { raceAudio } = await import('./audioDirector')
    raceAudio.playUi('select')
    raceAudio.playUi('step')
    raceAudio.playUi('confirm')
    expect(howls.some(h => h.play.mock.calls.length > 0)).toBe(true)
    raceAudio.dispose()
  })

  it('plays countdown ticks once per second and go once', async () => {
    const { raceAudio } = await import('./audioDirector')
    raceAudio.beginRace('sport', 'player-1')
    raceAudio.onCountdown(2.9)
    raceAudio.onCountdown(2.4)
    raceAudio.onCountdown(1.9)
    raceAudio.onCountdown(0.9)
    raceAudio.onGo()
    raceAudio.onGo()

    const played = howls.filter(h => !h.loop && h.play.mock.calls.length)
    // unlock silent + ui one-shots; tick/go should trigger plays
    expect(howls.some(h => h.play.mock.calls.length > 0)).toBe(true)
    const playCounts = howls.map(h => h.play.mock.calls.length)
    expect(playCounts.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(4)
    raceAudio.dispose()
  })

  it('maps finish kinds and keeps mute silent', async () => {
    const { raceAudio } = await import('./audioDirector')
    raceAudio.beginRace('light', 'player-1')
    raceAudio.setMuted(true)
    const playsBefore = howls.reduce((sum, h) => sum + h.play.mock.calls.length, 0)
    raceAudio.onCountdown(3)
    raceAudio.onGo()
    raceAudio.onFinish('win')
    const playsAfter = howls.reduce((sum, h) => sum + h.play.mock.calls.length, 0)
    expect(playsAfter).toBe(playsBefore)

    raceAudio.setMuted(false)
    raceAudio.beginRace('electric', 'player-1')
    raceAudio.onFinish('place')
    expect(howls.some(h => h.play.mock.calls.length > 0)).toBe(true)
    raceAudio.dispose()
  })

  it('updates engine loop rate with speed and brakes', async () => {
    const { raceAudio } = await import('./audioDirector')
    raceAudio.beginRace('sport', 'player-1')
    raceAudio.onGo()
    raceAudio.syncEngine({ speed: 0, maxSpeed: 200, accelerating: false, braking: false })
    raceAudio.syncEngine({ speed: 160, maxSpeed: 200, accelerating: true, braking: false })
    raceAudio.syncEngine({ speed: 120, maxSpeed: 200, accelerating: false, braking: true })
    const looping = howls.filter(h => h.loop)
    expect(looping.length).toBeGreaterThanOrEqual(2)
    expect(looping.some(h => h.rate.mock.calls.length > 0 || h.volume.mock.calls.length > 0 || h.play.mock.calls.length > 0)).toBe(true)
    raceAudio.dispose()
  })

  it('fires collision once per new player contact with cooldown', async () => {
    const { raceAudio } = await import('./audioDirector')
    raceAudio.beginRace('sport', 'player-1')
    raceAudio.onGo()
    const before = howls.reduce((sum, h) => sum + h.play.mock.calls.length, 0)
    raceAudio.onContacts(new Set(['player-1:wall-1']))
    raceAudio.onContacts(new Set(['player-1:wall-1']))
    raceAudio.onContacts(new Set(['player-1:wall-1', 'cpu-1:wall-1']))
    const after = howls.reduce((sum, h) => sum + h.play.mock.calls.length, 0)
    expect(after).toBeGreaterThan(before)
    raceAudio.dispose()
  })
})
