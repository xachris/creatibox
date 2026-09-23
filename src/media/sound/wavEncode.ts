/** Encode mono float samples as a WAV data URI for Howler. */
export function encodeWavDataUri(samples: Float32Array, sampleRate = 44100): string {
  const dataSize = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clipped = Math.max(-1, Math.min(1, samples[i]!))
    view.setInt16(offset, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true)
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

export type WaveType = 'sine' | 'triangle' | 'softSquare' | 'softSaw' | 'noise'

export function renderTone(
  durationSec: number,
  frequency: number,
  opts: {
    sampleRate?: number
    type?: WaveType
    attack?: number
    release?: number
    gain?: number
    slideTo?: number
    /** Soft-knee limiter amount 0–1 (higher = smoother). */
    warmth?: number
  } = {},
): Float32Array {
  const sampleRate = opts.sampleRate ?? 44100
  const total = Math.max(1, Math.floor(durationSec * sampleRate))
  const samples = new Float32Array(total)
  const attack = Math.max(1, Math.floor((opts.attack ?? 0.01) * sampleRate))
  const release = Math.max(1, Math.floor((opts.release ?? 0.08) * sampleRate))
  const gain = opts.gain ?? 0.4
  const type = opts.type ?? 'sine'
  const endFreq = opts.slideTo ?? frequency
  const warmth = opts.warmth ?? 0.35
  let phase = 0
  for (let i = 0; i < total; i++) {
    const envAttack = Math.min(1, i / attack)
    const envRelease = i > total - release ? Math.max(0, (total - i) / release) : 1
    // Smoothstep envelopes reduce clickiness.
    const a = envAttack * envAttack * (3 - 2 * envAttack)
    const r = envRelease * envRelease * (3 - 2 * envRelease)
    const envelope = a * r
    const freq = frequency + (endFreq - frequency) * (i / Math.max(1, total - 1))
    phase += (Math.PI * 2 * freq) / sampleRate
    const wave = sampleWave(type, phase)
    const shaped = Math.tanh(wave * (1 + warmth * 1.6)) / Math.tanh(1 + warmth * 1.6)
    samples[i] = shaped * gain * envelope
  }
  return samples
}

function sampleWave(type: WaveType, phase: number): number {
  const twopi = Math.PI * 2
  const p = ((phase % twopi) + twopi) % twopi
  const t = p / twopi
  if (type === 'sine') return Math.sin(phase)
  if (type === 'triangle') return 1 - 4 * Math.abs(t - 0.5)
  if (type === 'softSquare') {
    // Soft square via tanh of sine — much less harsh than a hard square.
    return Math.tanh(Math.sin(phase) * 2.4)
  }
  if (type === 'softSaw') {
    // Softened saw: fundamental + rolled-off harmonics.
    return (
      Math.sin(phase) * 0.72
      + Math.sin(phase * 2) * 0.28
      + Math.sin(phase * 3) * 0.12
      + Math.sin(phase * 4) * 0.05
    )
  }
  // White-ish noise; filtered downstream when needed.
  return Math.random() * 2 - 1
}

/** One-pole low-pass for smoothing noise / engine grit. */
export function lowPass(samples: Float32Array, amount = 0.18): Float32Array {
  const out = new Float32Array(samples.length)
  let prev = 0
  const a = Math.min(0.95, Math.max(0.02, amount))
  for (let i = 0; i < samples.length; i++) {
    prev = prev + a * (samples[i]! - prev)
    out[i] = prev
  }
  return out
}

export function mixSamples(...parts: Float32Array[]): Float32Array {
  const length = Math.max(0, ...parts.map(part => part.length))
  const out = new Float32Array(length)
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) out[i]! += part[i]!
  }
  // Soft peak normalize — keeps headroom instead of slamming to 1.0.
  let peak = 0
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]!))
  if (peak > 0.92) {
    const scale = 0.92 / peak
    for (let i = 0; i < out.length; i++) out[i]! *= scale
  }
  return out
}

/** Equal-power crossfade at both ends for seamless looping. */
export function seamlessLoop(samples: Float32Array, fadeSamples: number): Float32Array {
  const n = samples.length
  const fade = Math.min(Math.floor(n / 3), Math.max(8, fadeSamples))
  const out = samples.slice()
  for (let i = 0; i < fade; i++) {
    const t = i / fade
    const fadeIn = Math.sin((t * Math.PI) / 2)
    const fadeOut = Math.cos((t * Math.PI) / 2)
    const start = out[i]!
    const end = out[n - fade + i]!
    // Blend end into start so the loop join is continuous.
    out[i] = start * fadeIn + end * fadeOut
    out[n - fade + i] = end * fadeIn + start * fadeOut
  }
  return out
}
