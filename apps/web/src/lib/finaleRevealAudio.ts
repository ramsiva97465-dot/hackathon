/** Ceremony bed + one-shot FX for Top 5 LCD reveals.
 * Phase fractions MUST match GrandFinaleExperience place reveal:
 *   crown fast→slow 0→0.36 · countdown 0.36→0.52 · roll 0.52→0.70 · score 0.70→0.82 · name 0.82→1
 */

let ctx: AudioContext | null = null
let activeNodes: Array<AudioScheduledSourceNode | AudioNode> = []
let stopTimer: number | null = null

const CROWN_END = 0.36
const COUNT_END = 0.52
const ROLL_END = 0.70
const SCORE_END = 0.82

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
 * Hits sync with crown rise → 5/4/3/2/1 → letter roll → score → name lock.
 * Rank 2 uses Final Two face-off timing instead of the place-crown map.
 */
export function playFinaleRevealBed(rank: number, durationMs = 28_000) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const d = Math.max(8, durationMs / 1000)
  const isChamp = rank === 1
  const isSecond = rank === 2

  if (isSecond) {
    playFinalTwoBed(audio, t0, d, durationMs)
    return
  }

  // ── Crown fast→slow rise (0 → CROWN_END) ─────────────────────────────────
  // Opening whoosh + dense ticks (fast spin), then spaced ticks (slow settle).
  noiseBurst(audio, t0, Math.min(1.6, d * CROWN_END * 0.35), 0.18)
  tone(audio, 'sine', isChamp ? 48 : 56, t0, d * CROWN_END * 0.9, 0.2)
  tone(audio, 'triangle', isChamp ? 96 : 112, t0 + 0.1, d * CROWN_END * 0.75, 0.1)

  const fastSpan = d * CROWN_END * 0.45
  const slowSpan = d * CROWN_END * 0.5
  const fastTicks = Math.max(12, Math.round(fastSpan / 0.22))
  for (let i = 0; i < fastTicks; i++) {
    const at = t0 + (i / fastTicks) * fastSpan * 0.98
    tone(audio, 'square', 170 + i * 22, at, 0.06, 0.028 + i * 0.0018)
    tone(audio, 'sine', 340 + i * 14, at + 0.01, 0.08, 0.032)
  }
  const slowTicks = Math.max(6, Math.round(slowSpan / 0.55))
  for (let i = 0; i < slowTicks; i++) {
    const at = t0 + fastSpan + (i / slowTicks) * slowSpan * 0.95
    tone(audio, 'square', 200 + i * 10, at, 0.09, 0.04)
    tone(audio, 'sine', 400 + i * 8, at + 0.015, 0.12, 0.045)
  }
  // Crown lock thud
  noiseBurst(audio, t0 + d * CROWN_END, 0.3, 0.2)
  tone(audio, 'sine', 72, t0 + d * CROWN_END, 0.75, 0.24)

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
    const at = t0 + d * (CROWN_END + ((step + 0.08) / 5) * countSpan)
    const peak = 0.22 + i * 0.02
    noiseBurst(audio, at, 0.1, 0.07)
    tone(audio, 'triangle', freq, at, 0.55, peak)
    tone(audio, 'sine', freq * 2, at + 0.02, 0.4, peak * 0.4)
  })

  // ── Letter-roll ticks (COUNT_END → ROLL_END) ──────────────────────────────
  const rollStart = d * COUNT_END
  const rollEnd = d * ROLL_END
  const tickCount = Math.max(12, Math.round((rollEnd - rollStart) / 0.32))
  for (let i = 0; i < tickCount; i++) {
    const at = t0 + rollStart + (i / tickCount) * (rollEnd - rollStart)
    tone(audio, 'square', 210 + i * 12, at, 0.07, 0.032 + i * 0.0015)
    tone(audio, 'sine', 420 + i * 8, at + 0.01, 0.11, 0.038)
  }

  // ── Score flourish (ROLL_END → SCORE_END) ─────────────────────────────────
  const scoreAt = t0 + d * ROLL_END
  noiseBurst(audio, scoreAt, 0.35, 0.2)
  tone(audio, 'sine', isChamp ? 58 : 76, scoreAt, 1.2, 0.28)
  const scoreFreqs = isChamp
    ? [523.25, 659.25, 783.99, 1046.5]
    : [440, 554.37, 659.25]
  scoreFreqs.forEach((freq, i) => {
    tone(audio, 'triangle', freq, scoreAt + 0.06 + i * 0.1, 0.85, 0.13)
  })

  // ── Name lock (SCORE_END) ─────────────────────────────────────────────────
  const lock = t0 + d * SCORE_END
  noiseBurst(audio, lock, 0.45, 0.28)
  tone(audio, 'sine', isChamp ? 58 : 76, lock, 1.8, 0.34)
  tone(audio, 'triangle', isChamp ? 523 : 392, lock + 0.04, 1.4, 0.24)
  tone(audio, 'sine', isChamp ? 784 : 523, lock + 0.08, 1.1, 0.16)

  stopTimer = window.setTimeout(() => clearBed(), durationMs + 600)
}

/** Final Two: shuffle bed → pick whoosh → glyph lock → score → name. */
function playFinalTwoBed(audio: AudioContext, t0: number, d: number, durationMs: number) {
  // Soft tension bed under the swap
  tone(audio, 'sine', 48, t0, d * 0.76, 0.14)
  tone(audio, 'triangle', 96, t0 + 0.2, d * 0.7, 0.06)
  const swaps = 10
  for (let i = 0; i < swaps; i++) {
    const at = t0 + 0.05 * d + (i / swaps) * d * 0.58
    noiseBurst(audio, at, 0.12, 0.05 + (i % 2) * 0.02)
    tone(audio, 'sine', 180 + (i % 3) * 40, at, 0.18, 0.04)
  }

  // Hold breath
  tone(audio, 'sine', 62, t0 + d * 0.66, d * 0.1, 0.1)

  // Pick: runner-up glides center
  const pickAt = t0 + d * 0.76
  noiseBurst(audio, pickAt, 0.45, 0.16)
  tone(audio, 'sine', 80, pickAt, 1.4, 0.2)
  tone(audio, 'triangle', 220, pickAt + 0.08, 1.1, 0.08)

  // Glyph "2" lock
  const glyphAt = t0 + d * 0.9
  noiseBurst(audio, glyphAt, 0.28, 0.18)
  tone(audio, 'triangle', 440, glyphAt, 0.7, 0.22)
  tone(audio, 'sine', 880, glyphAt + 0.03, 0.5, 0.1)

  // Score first
  const scoreAt = t0 + d * 0.92
  noiseBurst(audio, scoreAt, 0.32, 0.2)
  ;[587.33, 739.99, 880].forEach((freq, i) => {
    tone(audio, 'triangle', freq, scoreAt + i * 0.1, 0.9, 0.14)
  })

  // Name last
  const nameAt = t0 + d * 0.96
  noiseBurst(audio, nameAt, 0.45, 0.26)
  tone(audio, 'sine', 70, nameAt, 1.6, 0.32)
  tone(audio, 'triangle', 440, nameAt + 0.04, 1.3, 0.22)
  tone(audio, 'sine', 659, nameAt + 0.08, 1.0, 0.14)

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
