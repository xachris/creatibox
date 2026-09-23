import type { SoundPreset } from '../../model/types'
import {
  encodeWavDataUri,
  lowPass,
  mixSamples,
  renderTone,
  seamlessLoop,
  type WaveType,
} from './wavEncode'

export type OneShotId =
  | 'countdownTick'
  | 'countdownGo'
  | 'finishWin'
  | 'finishPlace'
  | 'finishBroken'
  | 'collision'
  | 'brake'
  | 'uiSelect'
  | 'uiStep'
  | 'uiConfirm'

export type LoopId = 'engineIdle' | 'engineMove'

export interface SoundBank {
  oneShots: Record<OneShotId, string>
  loops: Record<LoopId, string>
}

function familyPitch(preset: SoundPreset) {
  if (preset === 'light') return 1.14
  if (preset === 'electric') return 1.28
  return 1
}

function familyTone(preset: SoundPreset): { body: WaveType; overtone: WaveType; noise: number; warmth: number } {
  if (preset === 'light') {
    return { body: 'sine', overtone: 'triangle', noise: 0.045, warmth: 0.45 }
  }
  if (preset === 'electric') {
    return { body: 'sine', overtone: 'sine', noise: 0.02, warmth: 0.55 }
  }
  return { body: 'softSaw', overtone: 'triangle', noise: 0.08, warmth: 0.4 }
}

function buildEngineLoop(preset: SoundPreset, kind: LoopId): string {
  const pitch = familyPitch(preset)
  const tone = familyTone(preset)
  const base = (kind === 'engineIdle' ? 72 : 104) * pitch
  const sampleRate = 44100
  // Integer cycles keep the loop phase-aligned and reduce seam clicks.
  const cycles = kind === 'engineIdle' ? 6 : 8
  const duration = cycles / base
  const bodyGain = kind === 'engineIdle' ? 0.22 : 0.3
  const overtoneGain = kind === 'engineIdle' ? 0.1 : 0.14

  const body = renderTone(duration, base, {
    sampleRate,
    type: tone.body,
    attack: 0.002,
    release: 0.002,
    gain: bodyGain,
    warmth: tone.warmth,
  })
  const overtone = renderTone(duration, base * (preset === 'electric' ? 2.01 : 1.99), {
    sampleRate,
    type: tone.overtone,
    attack: 0.002,
    release: 0.002,
    gain: overtoneGain,
    warmth: tone.warmth + 0.1,
  })
  const sub = renderTone(duration, base * 0.5, {
    sampleRate,
    type: 'sine',
    attack: 0.002,
    release: 0.002,
    gain: kind === 'engineIdle' ? 0.08 : 0.11,
    warmth: 0.6,
  })
  let noise = renderTone(duration, 80, {
    sampleRate,
    type: 'noise',
    attack: 0.002,
    release: 0.002,
    gain: tone.noise * (kind === 'engineIdle' ? 0.55 : 0.9),
    warmth: 0.2,
  })
  noise = lowPass(noise, preset === 'electric' ? 0.08 : 0.14)

  const mixed = seamlessLoop(mixSamples(body, overtone, sub, noise), Math.floor(sampleRate * 0.04))
  return encodeWavDataUri(mixed, sampleRate)
}

function delaySamples(part: Float32Array, delaySec: number, sampleRate = 44100): Float32Array {
  const offset = Math.floor(delaySec * sampleRate)
  const out = new Float32Array(offset + part.length)
  out.set(part, offset)
  return out
}

function buildUiBank(): Record<OneShotId, string> {
  return {
    countdownTick: encodeWavDataUri(
      mixSamples(
        renderTone(0.1, 740, { type: 'sine', attack: 0.004, release: 0.07, gain: 0.28, warmth: 0.5 }),
        renderTone(0.08, 1110, { type: 'triangle', attack: 0.004, release: 0.06, gain: 0.12, warmth: 0.45 }),
      ),
    ),
    countdownGo: encodeWavDataUri(
      mixSamples(
        renderTone(0.18, 523, { type: 'softSquare', attack: 0.008, release: 0.12, gain: 0.26, warmth: 0.5 }),
        renderTone(0.24, 784, { type: 'sine', attack: 0.01, release: 0.14, gain: 0.24, slideTo: 988, warmth: 0.45 }),
      ),
    ),
    finishWin: encodeWavDataUri(
      mixSamples(
        renderTone(0.16, 523, { type: 'sine', gain: 0.26, warmth: 0.5 }),
        delaySamples(renderTone(0.16, 659, { type: 'sine', gain: 0.26, warmth: 0.5 }), 0.14),
        delaySamples(renderTone(0.4, 784, { type: 'sine', gain: 0.3, release: 0.22, warmth: 0.5 }), 0.28),
        delaySamples(renderTone(0.5, 1046, { type: 'triangle', gain: 0.22, release: 0.28, warmth: 0.55 }), 0.42),
      ),
    ),
    finishPlace: encodeWavDataUri(
      mixSamples(
        renderTone(0.18, 440, { type: 'sine', gain: 0.24, warmth: 0.5 }),
        delaySamples(renderTone(0.32, 554, { type: 'triangle', gain: 0.22, release: 0.2, warmth: 0.5 }), 0.1),
      ),
    ),
    finishBroken: encodeWavDataUri(
      mixSamples(
        renderTone(0.32, 150, { type: 'softSaw', gain: 0.28, slideTo: 78, release: 0.24, warmth: 0.35 }),
        lowPass(renderTone(0.22, 90, { type: 'noise', gain: 0.16, release: 0.18, warmth: 0.2 }), 0.12),
      ),
    ),
    collision: encodeWavDataUri(
      mixSamples(
        lowPass(renderTone(0.07, 120, { type: 'noise', gain: 0.32, attack: 0.001, release: 0.06, warmth: 0.15 }), 0.2),
        renderTone(0.09, 180, { type: 'softSaw', gain: 0.16, slideTo: 90, release: 0.07, warmth: 0.35 }),
      ),
    ),
    brake: encodeWavDataUri(
      mixSamples(
        lowPass(renderTone(0.32, 700, { type: 'noise', gain: 0.14, attack: 0.03, release: 0.16, warmth: 0.2 }), 0.1),
        renderTone(0.28, 210, { type: 'triangle', gain: 0.1, slideTo: 150, release: 0.16, warmth: 0.4 }),
      ),
    ),
    uiSelect: encodeWavDataUri(
      mixSamples(
        renderTone(0.055, 690, { type: 'sine', attack: 0.002, release: 0.045, gain: 0.28, warmth: 0.55 }),
        renderTone(0.045, 1035, { type: 'triangle', attack: 0.002, release: 0.035, gain: 0.14, warmth: 0.5 }),
      ),
    ),
    uiStep: encodeWavDataUri(
      mixSamples(
        renderTone(0.07, 460, { type: 'sine', attack: 0.004, release: 0.055, gain: 0.26, slideTo: 610, warmth: 0.5 }),
        renderTone(0.06, 920, { type: 'triangle', attack: 0.004, release: 0.045, gain: 0.12, warmth: 0.5 }),
      ),
    ),
    uiConfirm: encodeWavDataUri(
      mixSamples(
        renderTone(0.09, 620, { type: 'softSquare', attack: 0.004, release: 0.07, gain: 0.22, warmth: 0.55 }),
        renderTone(0.13, 930, { type: 'sine', attack: 0.008, release: 0.1, gain: 0.22, slideTo: 1240, warmth: 0.5 }),
      ),
    ),
  }
}

const bankCache = new Map<SoundPreset, SoundBank>()
let uiBank: Record<OneShotId, string> | null = null

export function getUiOneShots(): Record<OneShotId, string> {
  if (!uiBank) uiBank = buildUiBank()
  return uiBank
}

export function getSoundBank(preset: SoundPreset): SoundBank {
  const cached = bankCache.get(preset)
  if (cached) return cached
  const ui = getUiOneShots()
  const bank: SoundBank = {
    oneShots: { ...ui },
    loops: {
      engineIdle: buildEngineLoop(preset, 'engineIdle'),
      engineMove: buildEngineLoop(preset, 'engineMove'),
    },
  }
  bankCache.set(preset, bank)
  return bank
}

/** Test helper / HMR: drop cached banks after timbre changes. */
export function clearSoundBanks() {
  bankCache.clear()
  uiBank = null
}
