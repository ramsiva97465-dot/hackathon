/** Ceremony bed + one-shot FX for Top 5 LCD reveals. */

let ctx: AudioContext | null = null
let activeNodes: Array<AudioScheduledSourceNode | AudioNode> = []
let stopTimer: number | null = null

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!ctx || ctx.state === 'closed') ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function clearBed() {
  if (stopTimer != null) {
    window.clearTimeout(stopTimer)
    stopTimer = null
  }
  for (const node of activeNodes) {
    try {
      if ('stop' in node && typeof node.stop === 'function') node.stop()
      node.disconnect()
    } catch {
      // already stopped
    }
  }
  activeNodes = []
}

function tone(
  audio: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  dur: number,
  peak: number,
  track = true,
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
  if (track) activeNodes.push(osc, gain)
}

function noiseBurst(audio: AudioContext, start: number, dur: number, peak: number, track = true) {
  const length = Math.max(1, Math.floor(audio.sampleRate * dur))
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const src = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  src.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1100, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  src.start(start)
  src.stop(start + dur + 0.02)
  if (track) activeNodes.push(src, filter, gain)
}

/**
 * Starts a reveal score sized to `durationMs`.
 * Hits: curtain → roll ticks → 3/2/1 → name lock → seal stamp → score flourish.
 */
export function playFinaleRevealBed(rank: number, durationMs = 20_000) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const d = Math.max(8, durationMs / 1000)
  const isChamp = rank === 1
  const isSecond = rank === 2

  // Curtain whoosh + deep pad
  noiseBurst(audio, t0, Math.min(2.4, d * 0.14), 0.14)
  tone(audio, 'sine', isChamp ? 48 : 56, t0, d * 0.2, 0.2)
  tone(audio, 'triangle', isChamp ? 96 : 112, t0 + 0.18, d * 0.18, 0.09)
  tone(audio, 'sine', isChamp ? 192 : 168, t0 + 0.35, 1.8, 0.05)

  // Letter-roll tension ticks (~0.18–0.46)
  const tickStart = d * 0.18
  const tickEnd = d * 0.46
  const tickCount = Math.max(12, Math.round((tickEnd - tickStart) / 0.38))
  for (let i = 0; i < tickCount; i++) {
    const at = t0 + tickStart + (i / tickCount) * (tickEnd - tickStart)
    tone(audio, 'square', 210 + i * 14, at, 0.07, 0.035 + i * 0.002)
    tone(audio, 'sine', 420 + i * 10, at + 0.01, 0.12, 0.04)
  }

  // Soft pulse under the wait
  for (let i = 0; i < Math.floor(d * 0.45); i++) {
    const at = t0 + 1.4 + i * 1.05
    if (at >= t0 + d * 0.84) break
    tone(audio, 'sine', isChamp ? 46 : 52, at, 0.5, 0.07)
  }

  // Name-in countdown 3 · 2 · 1
  ;[
    { at: d * 0.46, freq: 392, peak: 0.26 },
    { at: d * 0.62, freq: 494, peak: 0.28 },
    { at: d * 0.754, freq: 587, peak: 0.3 },
  ].forEach(({ at, freq, peak }) => {
    noiseBurst(audio, t0 + at, 0.12, 0.08)
    tone(audio, 'triangle', freq, t0 + at, 0.65, peak)
    tone(audio, 'sine', freq * 2, t0 + at + 0.02, 0.45, peak * 0.45)
    tone(audio, 'sine', freq * 3, t0 + at + 0.04, 0.3, peak * 0.18)
  })

  // Name lock impact — progress 0.88
  const lock = t0 + d * 0.88
  noiseBurst(audio, lock, 0.45, 0.28)
  tone(audio, 'sine', isChamp ? 58 : 76, lock, 1.8, 0.34)
  tone(audio, 'triangle', isChamp ? 523 : isSecond ? 440 : 392, lock + 0.04, 1.4, 0.24)
  tone(audio, 'sine', isChamp ? 784 : isSecond ? 659 : 523, lock + 0.08, 1.1, 0.16)

  // Score flourish
  const endFreqs = isChamp
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
    : isSecond
    ? [587.33, 739.99, 880, 1174.66]
    : [440, 554.37, 659.25, 880]
  endFreqs.forEach((freq, i) => {
    tone(audio, 'triangle', freq, t0 + d * 0.94 + i * 0.11, 0.95, 0.14)
  })

  stopTimer = window.setTimeout(() => clearBed(), durationMs + 600)
}

export function stopFinaleRevealBed() {
  clearBed()
}

/** Unlock audio on LCD after any user gesture (autoplay policy). */
export function unlockFinaleAudio() {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()
}
