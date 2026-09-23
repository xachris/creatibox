import type { SoundPreset } from '../../model/types'
import { encodeWavDataUri, mixSamples, renderTone } from './wavEncode'

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
  if (preset === 'light') return 1.18
  if (preset === 'electric') return 1.35
  return 1
}

function familyNoise(preset: SoundPreset) {
  if (preset === 'light') return 0.12
  if (preset === 'electric') return 0.05
  return 0.22
}

function buildEngineLoop(preset: SoundPreset, kind: LoopId): string {
  const pitch = familyPitch(preset)
  const noiseAmt = familyNoise(preset)
  const base = kind === 'engineIdle' ? 78 * pitch : 118 * pitch
  const duration = 0.55
  const sampleRate = 22050
  const toneA = renderTone(duration, base, {
    sampleRate,
    type: preset === 'electric' ? 'sine' : 'saw',
    attack: 0.02,
    release: 0.02,
    gain: kind === 'engineIdle' ? 0.18 : 0.28,
  })
  const toneB = renderTone(duration, base * (preset === 'electric' ? 2.02 : 1.5), {
    sampleRate,
    type: preset === 'light' ? 'sine' : 'square',
    attack: 0.02,
    release: 0.02,
    gain: kind === 'engineIdle' ? 0.08 : 0.12,
  })
  const noise = renderTone(duration, 100, {
    sampleRate,
    type: 'noise',
    attack: 0.01,
    release: 0.01,
    gain: noiseAmt * (kind === 'engineIdle' ? 0.35 : 0.7),
  })
  const mixed = mixSamples(toneA, toneB, noise)
  const fade = Math.floor(sampleRate * 0.02)
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    mixed[i]! *= g
    mixed[mixed.length - 1 - i]! *= g
  }
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
      renderTone(0.12, 880, { type: 'square', attack: 0.005, release: 0.06, gain: 0.35 }),
    ),
    countdownGo: encodeWavDataUri(
      mixSamples(
        renderTone(0.22, 523, { type: 'square', attack: 0.005, release: 0.1, gain: 0.35 }),
        renderTone(0.28, 784, { type: 'square', attack: 0.01, release: 0.12, gain: 0.28, slideTo: 988 }),
      ),
    ),
    finishWin: encodeWavDataUri(
      mixSamples(
        renderTone(0.18, 523, { type: 'sine', gain: 0.3 }),
        delaySamples(renderTone(0.18, 659, { type: 'sine', gain: 0.3 }), 0.16),
        delaySamples(renderTone(0.45, 784, { type: 'sine', gain: 0.34, release: 0.2 }), 0.3),
        delaySamples(renderTone(0.55, 1046, { type: 'sine', gain: 0.28, release: 0.25 }), 0.46),
      ),
    ),
    finishPlace: encodeWavDataUri(
      mixSamples(
        renderTone(0.2, 440, { type: 'sine', gain: 0.28 }),
        delaySamples(renderTone(0.35, 554, { type: 'sine', gain: 0.25, release: 0.18 }), 0.12),
      ),
    ),
    finishBroken: encodeWavDataUri(
      mixSamples(
        renderTone(0.35, 160, { type: 'saw', gain: 0.35, slideTo: 70, release: 0.25 }),
        renderTone(0.25, 90, { type: 'noise', gain: 0.22, release: 0.2 }),
      ),
    ),
    collision: encodeWavDataUri(
      mixSamples(
        renderTone(0.08, 140, { type: 'noise', gain: 0.45, attack: 0.001, release: 0.07 }),
        renderTone(0.1, 220, { type: 'square', gain: 0.2, slideTo: 90, release: 0.08 }),
      ),
    ),
    brake: encodeWavDataUri(
      mixSamples(
        renderTone(0.35, 900, { type: 'noise', gain: 0.2, attack: 0.02, release: 0.15 }),
        renderTone(0.3, 240, { type: 'saw', gain: 0.12, slideTo: 160, release: 0.15 }),
      ),
    ),
    // Soft pop for picking a car / driver / track option.
    uiSelect: encodeWavDataUri(
      mixSamples(
        renderTone(0.06, 720, { type: 'sine', attack: 0.002, release: 0.05, gain: 0.32 }),
        renderTone(0.05, 1080, { type: 'sine', attack: 0.002, release: 0.04, gain: 0.18 }),
      ),
    ),
    // Slightly deeper cue when moving between wizard steps.
    uiStep: encodeWavDataUri(
      mixSamples(
        renderTone(0.08, 480, { type: 'sine', attack: 0.004, release: 0.06, gain: 0.3, slideTo: 640 }),
        renderTone(0.07, 960, { type: 'sine', attack: 0.004, release: 0.05, gain: 0.16 }),
      ),
    ),
    // Bright confirm for "start race".
    uiConfirm: encodeWavDataUri(
      mixSamples(
        renderTone(0.1, 660, { type: 'square', attack: 0.003, release: 0.07, gain: 0.28 }),
        renderTone(0.14, 990, { type: 'sine', attack: 0.008, release: 0.1, gain: 0.24, slideTo: 1320 }),
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
