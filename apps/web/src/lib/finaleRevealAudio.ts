/** Ceremony bed + one-shot FX for Top 5 LCD reveals.
 * Phase fractions MUST match GrandFinaleExperience place reveal:
 *   crown scroll 0→0.32 · countdown 0.32→0.52 · roll 0.52→0.82 · name 0.82→1
 */

let ctx: AudioContext | null = null
let activeNodes: Array<AudioScheduledSourceNode | AudioNode> = []
let stopTimer: number | null = null

const CROWN_END = 0.32
const COUNT_END = 0.52
const ROLL_END = 0.82

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
 * Hits sync with crown scroll → 5/4/3/2/1 → letter roll → name lock → score.
 */
export function playFinaleRevealBed(rank: number, durationMs = 28_000) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const d = Math.max(8, durationMs / 1000)
  const isChamp = rank === 1
  const isSecond = rank === 2

  // ── Crown scroll (0 → CROWN_END) — whoosh + spin ticks ────────────────────
  noiseBurst(audio, t0, Math.min(2.2, d * CROWN_END * 0.55), 0.16)
  tone(audio, 'sine', isChamp ? 48 : 56, t0, d * CROWN_END * 0.85, 0.2)
  tone(audio, 'triangle', isChamp ? 96 : 112, t0 + 0.12, d * CROWN_END * 0.7, 0.1)
  const crownTicks = Math.max(10, Math.round((d * CROWN_END) / 0.55))
  for (let i = 0; i < crownTicks; i++) {
    const at = t0 + (i / crownTicks) * d * CROWN_END * 0.92
    tone(audio, 'square', 160 + i * 18, at, 0.08, 0.03 + i * 0.002)
    tone(audio, 'sine', 320 + i * 12, at + 0.01, 0.1, 0.035)
  }
  // Crown lock thud
  noiseBurst(audio, t0 + d * CROWN_END, 0.28, 0.18)
  tone(audio, 'sine', 72, t0 + d * CROWN_END, 0.7, 0.22)

  // Soft pulse under countdown + roll
  for (let i = 0; i < Math.floor(d * 0.4); i++) {
    const at = t0 + d * CROWN_END + 0.4 + i * 1.05
    if (at >= t0 + d * ROLL_END) break
    tone(audio, 'sine', isChamp ? 46 : 52, at, 0.5, 0.065)
  }

  // ── Countdown 5 · 4 · 3 · 2 · 1 (CROWN_END → COUNT_END) ───────────────────
  const countSpan = COUNT_END - CROWN_END
  ;[
    { step: 0, freq: 311 },
    { step: 1, freq: 349 },
    { step: 2, freq: 392 },
    { step: 3, freq: 466 },
    { step: 4, freq: 523 },
  ].forEach(({ step, freq }, i) => {
    const at = t0 + d * (CROWN_END + (step + 0.08) / 5 * countSpan)
    const peak = 0.22 + i * 0.02
    noiseBurst(audio, at, 0.1, 0.07)
    tone(audio, 'triangle', freq, at, 0.55, peak)
    tone(audio, 'sine', freq * 2, at + 0.02, 0.4, peak * 0.4)
  })

  // ── Letter-roll ticks (COUNT_END → ROLL_END) ──────────────────────────────
  const rollStart = d * COUNT_END
  const rollEnd = d * ROLL_END
  const tickCount = Math.max(14, Math.round((rollEnd - rollStart) / 0.32))
  for (let i = 0; i < tickCount; i++) {
    const at = t0 + rollStart + (i / tickCount) * (rollEnd - rollStart)
    tone(audio, 'square', 210 + i * 12, at, 0.07, 0.032 + i * 0.0015)
    tone(audio, 'sine', 420 + i * 8, at + 0.01, 0.11, 0.038)
  }

  // ── Name lock (ROLL_END) ──────────────────────────────────────────────────
  const lock = t0 + d * ROLL_END
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
    tone(audio, 'triangle', freq, t0 + d * (ROLL_END + 0.08) + i * 0.11, 0.95, 0.14)
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
