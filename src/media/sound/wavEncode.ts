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

export function renderTone(
  durationSec: number,
  frequency: number,
  opts: {
    sampleRate?: number
    type?: 'sine' | 'square' | 'saw' | 'noise'
    attack?: number
    release?: number
    gain?: number
    slideTo?: number
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
  let phase = 0
  for (let i = 0; i < total; i++) {
    const envAttack = Math.min(1, i / attack)
    const envRelease = i > total - release ? Math.max(0, (total - i) / release) : 1
    const envelope = envAttack * envRelease
    const freq = frequency + (endFreq - frequency) * (i / Math.max(1, total - 1))
    phase += (Math.PI * 2 * freq) / sampleRate
    let wave = 0
    if (type === 'sine') wave = Math.sin(phase)
    else if (type === 'square') wave = Math.sin(phase) > 0 ? 1 : -1
    else if (type === 'saw') wave = ((phase % (Math.PI * 2)) / Math.PI) - 1
    else wave = Math.random() * 2 - 1
    samples[i] = wave * gain * envelope
  }
  return samples
}

export function mixSamples(...parts: Float32Array[]): Float32Array {
  const length = Math.max(0, ...parts.map(part => part.length))
  const out = new Float32Array(length)
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) out[i]! += part[i]!
  }
  let peak = 0
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]!))
  if (peak > 1) {
    for (let i = 0; i < out.length; i++) out[i]! /= peak
  }
  return out
}
