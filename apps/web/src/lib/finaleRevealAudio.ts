/** 10-second ceremony bed — timed to match finale-stage-bg.mp4 + place reveal progress. */

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
 * Starts a one-shot 10s reveal score. Call at step start; cancels any previous bed.
 * Hits align with PlaceReveal progress: roll → 3/2/1 → name lock → score.
 */
export function playFinaleRevealBed(rank: number, durationMs = 10_000) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const isChamp = rank === 1
  const isSecond = rank === 2

  // 0.00–2.2s — open whoosh + low pad (video curtain)
  noiseBurst(audio, t0, 1.4, 0.12)
  tone(audio, 'sine', isChamp ? 55 : 62, t0, 2.4, 0.18)
  tone(audio, 'triangle', isChamp ? 110 : 124, t0 + 0.15, 2.2, 0.08)

  // 2.2–4.6s — rising tension ticks (letter roll)
  for (let i = 0; i < 8; i++) {
    const at = t0 + 2.2 + i * 0.28
    tone(audio, 'sine', 180 + i * 18, at, 0.16, 0.07 + i * 0.008)
  }

  // Name-in countdown 3 · 2 · 1 — matches PlaceReveal progress 0.46 / 0.62 / 0.754
  ;[
    { at: 4.6, freq: 392 },
    { at: 6.2, freq: 494 },
    { at: 7.55, freq: 587 },
  ].forEach(({ at, freq }) => {
    tone(audio, 'triangle', freq, t0 + at, 0.45, 0.22)
    tone(audio, 'sine', freq * 2, t0 + at + 0.02, 0.35, 0.1)
  })

  // 8.8s — name lock impact
  const lock = t0 + 8.8
  noiseBurst(audio, lock, 0.35, 0.22)
  tone(audio, 'sine', isChamp ? 65 : 82, lock, 1.4, 0.28)
  tone(audio, 'triangle', isChamp ? 523 : isSecond ? 440 : 392, lock + 0.04, 1.1, 0.2)
  tone(audio, 'sine', isChamp ? 784 : isSecond ? 659 : 523, lock + 0.08, 0.9, 0.14)

  // 9.2–10s — score settle flourish
  const endFreqs = isChamp
    ? [523.25, 659.25, 783.99, 1046.5]
    : isSecond
    ? [587.33, 739.99, 880]
    : [440, 554.37, 659.25]
  endFreqs.forEach((freq, i) => {
    tone(audio, 'triangle', freq, t0 + 9.15 + i * 0.1, 0.7, 0.12)
  })

  stopTimer = window.setTimeout(() => clearBed(), durationMs + 400)
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
