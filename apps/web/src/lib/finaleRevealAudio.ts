/** Ceremony bed — scales to the finale beat so suspense hits stay locked to progress. */

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
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
  activeNodes.push(osc, gain)
}

function noiseBurst(audio: AudioContext, start: number, dur: number, peak: number) {
  const length = Math.max(1, Math.floor(audio.sampleRate * dur))
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const src = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  src.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  src.start(start)
  src.stop(start + dur + 0.02)
  activeNodes.push(src, filter, gain)
}

/**
 * Starts a reveal score sized to `durationMs`.
 * Hits align with PlaceReveal progress: roll → 3/2/1 → name lock → score.
 */
export function playFinaleRevealBed(rank: number, durationMs = 20_000) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const d = Math.max(8, durationMs / 1000)
  const isChamp = rank === 1
  const isSecond = rank === 2

  // Open whoosh + low pad (progress ~0–0.18)
  noiseBurst(audio, t0, Math.min(2.2, d * 0.12), 0.12)
  tone(audio, 'sine', isChamp ? 55 : 62, t0, d * 0.18, 0.18)
  tone(audio, 'triangle', isChamp ? 110 : 124, t0 + 0.2, d * 0.16, 0.08)

  // Rising tension ticks through the letter-roll window (~0.18–0.46)
  const tickStart = d * 0.18
  const tickEnd = d * 0.46
  const tickCount = Math.max(10, Math.round((tickEnd - tickStart) / 0.45))
  for (let i = 0; i < tickCount; i++) {
    const at = t0 + tickStart + (i / tickCount) * (tickEnd - tickStart)
    tone(audio, 'sine', 170 + i * 12, at, 0.18, 0.055 + i * 0.004)
  }

  // Soft heartbeat under the long wait
  for (let i = 0; i < Math.floor(d * 0.4); i++) {
    const at = t0 + 1.2 + i * 1.15
    if (at >= t0 + d * 0.86) break
    tone(audio, 'sine', isChamp ? 48 : 54, at, 0.55, 0.06)
  }

  // Name-in countdown 3 · 2 · 1 — progress 0.46 / 0.62 / 0.754
  ;[
    { at: d * 0.46, freq: 392 },
    { at: d * 0.62, freq: 494 },
    { at: d * 0.754, freq: 587 },
  ].forEach(({ at, freq }) => {
    tone(audio, 'triangle', freq, t0 + at, 0.55, 0.24)
    tone(audio, 'sine', freq * 2, t0 + at + 0.02, 0.4, 0.11)
  })

  // Name lock impact — progress 0.88
  const lock = t0 + d * 0.88
  noiseBurst(audio, lock, 0.4, 0.24)
  tone(audio, 'sine', isChamp ? 65 : 82, lock, 1.6, 0.3)
  tone(audio, 'triangle', isChamp ? 523 : isSecond ? 440 : 392, lock + 0.04, 1.3, 0.22)
  tone(audio, 'sine', isChamp ? 784 : isSecond ? 659 : 523, lock + 0.08, 1.0, 0.15)

  // Score settle flourish — progress ~0.915
  const endFreqs = isChamp
    ? [523.25, 659.25, 783.99, 1046.5]
    : isSecond
    ? [587.33, 739.99, 880]
    : [440, 554.37, 659.25]
  endFreqs.forEach((freq, i) => {
    tone(audio, 'triangle', freq, t0 + d * 0.915 + i * 0.12, 0.85, 0.13)
  })

  stopTimer = window.setTimeout(() => clearBed(), durationMs + 500)
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
