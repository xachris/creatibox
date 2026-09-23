import { Howl, Howler } from 'howler'
import type { SoundPreset } from '../../model/types'
import { getSoundBank, getUiOneShots, type OneShotId } from './synthBank'

export type FinishSoundKind = 'win' | 'place' | 'broken'

export interface EngineAudioState {
  speed: number
  maxSpeed: number
  accelerating: boolean
  braking: boolean
}

const MUTE_KEY = 'creatibox-audio-muted'
const VOLUME_KEY = 'creatibox-audio-volume'

function readMuted() {
  try { return sessionStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}
function writeMuted(value: boolean) {
  try { sessionStorage.setItem(MUTE_KEY, value ? '1' : '0') } catch { /* ignore */ }
}
function readVolume() {
  try {
    const raw = Number(sessionStorage.getItem(VOLUME_KEY))
    return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0.7
  } catch {
    return 0.7
  }
}
function writeVolume(value: number) {
  try { sessionStorage.setItem(VOLUME_KEY, String(value)) } catch { /* ignore */ }
}

class AudioDirector {
  private unlocked = false
  private muted = readMuted()
  private masterVolume = readVolume()
  private preset: SoundPreset = 'sport'
  private oneShots = new Map<string, Howl>()
  private idle: Howl | null = null
  private move: Howl | null = null
  private brakeLoop: Howl | null = null
  private lastTickSecond = -1
  private goPlayed = false
  private finishPlayed = false
  private collisionAt = 0
  private knownContacts = new Set<string>()
  private playerId = ''

  isMuted() {
    return this.muted
  }

  getVolume() {
    return this.masterVolume
  }

  setMuted(value: boolean) {
    this.muted = value
    writeMuted(value)
    Howler.mute(value)
    if (value) this.stopEngine()
  }

  toggleMuted() {
    this.setMuted(!this.muted)
    return this.muted
  }

  setVolume(value: number) {
    this.masterVolume = Math.min(1, Math.max(0, value))
    writeVolume(this.masterVolume)
    Howler.volume(this.masterVolume)
  }

  /** Must run inside a user gesture so browsers allow playback. */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    Howler.mute(this.muted)
    Howler.volume(this.masterVolume)
    const kick = new Howl({
      src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='],
      volume: 0,
    })
    kick.play()
    kick.once('play', () => {
      kick.stop()
      kick.unload()
    })
    this.ensureUiSounds()
  }

  beginRace(soundPreset: SoundPreset, playerId: string) {
    this.unlock()
    this.stopAll()
    this.preset = soundPreset
    this.playerId = playerId
    this.lastTickSecond = -1
    this.goPlayed = false
    this.finishPlayed = false
    this.knownContacts = new Set()
    this.loadPreset(soundPreset)
  }

  onCountdown(secondsLeft: number) {
    if (!this.unlocked || this.muted) return
    const second = Math.ceil(secondsLeft - 1e-8)
    if (second >= 1 && second <= 3 && second !== this.lastTickSecond) {
      this.lastTickSecond = second
      this.playOneShot('countdownTick', 0.72)
    }
  }

  onGo() {
    if (!this.unlocked || this.muted || this.goPlayed) return
    this.goPlayed = true
    this.playOneShot('countdownGo', 0.85)
  }

  onFinish(kind: FinishSoundKind) {
    if (!this.unlocked || this.muted || this.finishPlayed) return
    this.finishPlayed = true
    this.stopEngine()
    const id = kind === 'win' ? 'finishWin' : kind === 'place' ? 'finishPlace' : 'finishBroken'
    this.playOneShot(id, 0.9)
  }

  onContacts(contacts: ReadonlySet<string>) {
    if (!this.unlocked || this.muted) {
      this.knownContacts = new Set(contacts)
      return
    }
    for (const key of contacts) {
      if (this.knownContacts.has(key)) continue
      if (this.playerId && !key.includes(this.playerId)) continue
      this.onCollision()
    }
    this.knownContacts = new Set(contacts)
  }

  onCollision() {
    if (!this.unlocked || this.muted) return
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (now - this.collisionAt < 220) return
    this.collisionAt = now
    this.playOneShot('collision', 0.7)
  }

  syncEngine(state: EngineAudioState) {
    if (!this.unlocked || this.muted || this.finishPlayed) {
      this.stopEngine()
      return
    }
    if (!this.idle || !this.move) this.loadPreset(this.preset)

    const ratio = Math.min(1, Math.max(0, state.speed / Math.max(state.maxSpeed, 1)))
    const accelerating = state.accelerating
    const braking = state.braking && state.speed > 8

    if (!this.idle || !this.move) return

    if (ratio < 0.03 && !accelerating) {
      if (!this.idle.playing()) this.idle.play()
      this.idle.volume(0.22)
      this.idle.rate(0.92)
      if (this.move.playing()) this.move.volume(0)
      if (this.brakeLoop?.playing()) this.brakeLoop.stop()
      return
    }

    if (!this.move.playing()) this.move.play()
    if (!this.idle.playing()) this.idle.play()
    this.idle.volume(Math.max(0, 0.14 * (1 - ratio)))
    const rate = (this.preset === 'electric' ? 0.85 : 0.75) + ratio * (accelerating ? 0.95 : 0.7)
    const volume = (0.18 + ratio * 0.55) * (accelerating ? 1 : state.braking ? 0.7 : 0.82)
    this.move.rate(rate)
    this.move.volume(volume)

    if (braking) {
      if (this.brakeLoop && !this.brakeLoop.playing()) {
        this.brakeLoop.volume(0.32)
        this.brakeLoop.play()
      }
    } else if (this.brakeLoop?.playing()) {
      this.brakeLoop.stop()
    }
  }

  stopAll() {
    this.stopEngine()
    for (const sound of this.oneShots.values()) sound.stop()
  }

  dispose() {
    this.stopAll()
    for (const sound of this.oneShots.values()) sound.unload()
    this.oneShots.clear()
    this.idle?.unload(); this.idle = null
    this.move?.unload(); this.move = null
    this.brakeLoop?.unload(); this.brakeLoop = null
  }

  private playOneShot(id: OneShotId, volume: number) {
    this.ensureUiSounds()
    const sound = this.oneShots.get(id)
    if (!sound) return
    sound.stop()
    sound.volume(volume)
    sound.play()
  }

  private ensureUiSounds() {
    if (this.oneShots.has('countdownTick')) return
    const ui = getUiOneShots()
    for (const [id, src] of Object.entries(ui) as [OneShotId, string][]) {
      if (id === 'brake') continue
      this.oneShots.set(id, new Howl({ src: [src], volume: 0.7, preload: true }))
    }
  }

  private loadPreset(preset: SoundPreset) {
    this.preset = preset
    this.ensureUiSounds()
    const bank = getSoundBank(preset)
    this.idle?.unload()
    this.move?.unload()
    this.brakeLoop?.unload()
    this.idle = new Howl({ src: [bank.loops.engineIdle], loop: true, volume: 0.2, preload: true })
    this.move = new Howl({ src: [bank.loops.engineMove], loop: true, volume: 0, preload: true })
    this.brakeLoop = new Howl({ src: [bank.oneShots.brake], loop: true, volume: 0.3, preload: true })
  }

  private stopEngine() {
    if (this.idle?.playing()) this.idle.stop()
    if (this.move?.playing()) this.move.stop()
    if (this.brakeLoop?.playing()) this.brakeLoop.stop()
  }
}

export const raceAudio = new AudioDirector()
