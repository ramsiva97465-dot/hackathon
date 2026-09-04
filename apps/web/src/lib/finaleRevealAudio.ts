/** Ceremony bed + one-shot FX for Top 5 LCD reveals.
 * Place (5/4/3): crown 0→0.36 (stable) · count 0.36→0.52 · roll 0.52→0.70 · score 0.70→0.82 · name 0.82→1
 * Final Two (2): dedicated shuffle/pick/score/name bed
 * Champion (1): 6s countdown · 6s roll · winner lock at 12s (22s total) — unchanged path
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
 * Rank 1 → Champion bed. Rank 2 + finalTwo (default) → Final Two bed.
 * Rank 2 with finalTwo:false → place bed (Special Category Runner).
 */
export function playFinaleRevealBed(
  rank: number,
  durationMs = 28_000,
  options?: { finalTwo?: boolean },
) {
  clearBed()
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + 0.02
  const d = Math.max(8, durationMs / 1000)

  if (rank === 1) {
    playChampionBed(audio, t0, d, durationMs)
    return
  }
  if (rank === 2 && options?.finalTwo !== false) {
    playFinalTwoBed(audio, t0, d, durationMs)
    return
  }

  // ── Crown rise only (0 → CROWN_END) — no count beeps until the wreath locks ─
  // Soft whoosh + low rumble while spinning; one clear thud when stable.
  noiseBurst(audio, t0, Math.min(1.4, d * CROWN_END * 0.32), 0.14)
  tone(audio, 'sine', 52, t0, d * CROWN_END * 0.95, 0.16)
  tone(audio, 'triangle', 96, t0 + 0.12, d * CROWN_END * 0.7, 0.07)
  // Sparse mechanical ticks (spin texture only — not countdown pitches)
  const spinTicks = Math.max(8, Math.round((d * CROWN_END) / 0.55))
  for (let i = 0; i < spinTicks; i++) {
    const u = i / spinTicks
    const at = t0 + u * d * CROWN_END * 0.92
    const dens = u < 0.45 ? 0.022 : 0.034
    tone(audio, 'square', 150 + u * 40, at, 0.05, dens)
  }
  // Crown stable lock — counting starts on the next beat
  const crownLock = t0 + d * CROWN_END
  noiseBurst(audio, crownLock, 0.35, 0.24)
  tone(audio, 'sine', 68, crownLock, 0.85, 0.28)
  tone(audio, 'triangle', 136, crownLock + 0.03, 0.55, 0.1)

  // Soft bed under count + roll (no pitch steps)
  for (let i = 0; i < Math.floor(d * 0.35); i++) {
    const at = crownLock + 0.55 + i * 1.15
    if (at >= t0 + d * ROLL_END) break
    tone(audio, 'sine', 48, at, 0.55, 0.05)
  }

  // ── Countdown 5·4·3·2·1 — exact visual digit boundaries after crown lock ──
  // Visual: placeCountdownDigit uses t = 0,0.2,0.4,0.6,0.8 of (COUNT_END - CROWN_END).
  const countSpan = COUNT_END - CROWN_END
  ;[
    { step: 0, freq: 311 },
    { step: 1, freq: 349 },
    { step: 2, freq: 392 },
    { step: 3, freq: 466 },
    { step: 4, freq: 523 },
  ].forEach(({ step, freq }, i) => {
    const at = t0 + d * (CROWN_END + (step / 5) * countSpan)
    const peak = 0.26 + i * 0.03
    noiseBurst(audio, at, 0.1, 0.08)
    tone(audio, 'triangle', freq, at, 0.5, peak)
    tone(audio, 'sine', freq * 2, at + 0.015, 0.38, peak * 0.4)
  })

  // ── Split-flap scroll (COUNT_END → ROLL_END) — same interval curve as flapGlyph
  const rollStart = d * COUNT_END
  const rollEnd = d * ROLL_END
  const rollSpan = Math.max(0.5, rollEnd - rollStart)
  // Accent when ROLLING tiles appear
  noiseBurst(audio, t0 + rollStart, 0.18, 0.12)
  tone(audio, 'square', 240, t0 + rollStart, 0.12, 0.06)
  let rollAt = 0
  let tick = 0
  while (rollAt < rollSpan - 0.05) {
    const rollT = rollAt / rollSpan
    const interval = (110 + rollT * 220) / 1000
    const at = t0 + rollStart + rollAt
    const peak = 0.028 + rollT * 0.02
    tone(audio, 'square', 200 + tick * 10, at, 0.055, peak)
    tone(audio, 'sine', 400 + tick * 7, at + 0.008, 0.09, peak * 1.15)
    rollAt += interval
    tick += 1
    if (tick > 48) break
  }

  // ── Score reveal (ROLL_END) ───────────────────────────────────────────────
  const scoreAt = t0 + d * ROLL_END
  noiseBurst(audio, scoreAt, 0.4, 0.24)
  tone(audio, 'sine', 72, scoreAt, 1.3, 0.32)
  ;[440, 554.37, 659.25].forEach((freq, i) => {
    tone(audio, 'triangle', freq, scoreAt + 0.05 + i * 0.09, 0.9, 0.15)
  })

  // ── Team name + little popup hit (SCORE_END) ───────────────────────────────
  const lock = t0 + d * SCORE_END
  noiseBurst(audio, lock, 0.55, 0.34)
  tone(audio, 'sine', 70, lock, 2.0, 0.38)
  tone(audio, 'triangle', 392, lock + 0.04, 1.55, 0.28)
  tone(audio, 'sine', 523, lock + 0.08, 1.25, 0.2)
  tone(audio, 'triangle', 659, lock + 0.14, 0.95, 0.14)
  // Soft afterglow under name hold
  tone(audio, 'sine', 52, lock + 0.6, Math.max(0.8, d * (1 - SCORE_END) - 0.6), 0.07)

  stopTimer = window.setTimeout(() => clearBed(), durationMs + 600)
}

/** Champion: 6s countdown → 6s roll → winner (name + score) hold. Matches CHAMPION_*_MS. */
function playChampionBed(audio: AudioContext, t0: number, d: number, durationMs: number) {
  const COUNT_S = 6
  const ROLL_S = 6
  const WIN_AT = COUNT_S + ROLL_S

  // Low tension bed through countdown + roll
  tone(audio, 'sine', 46, t0, WIN_AT + 0.5, 0.16)
  tone(audio, 'triangle', 92, t0 + 0.15, WIN_AT, 0.07)

  // Countdown 5→1 every 1.2s (matches Champion UI)
  ;[
    { step: 0, freq: 311 },
    { step: 1, freq: 349 },
    { step: 2, freq: 392 },
    { step: 3, freq: 466 },
    { step: 4, freq: 523 },
  ].forEach(({ step, freq }, i) => {
    const at = t0 + step * 1.2 + 0.08
    const peak = 0.24 + i * 0.025
    noiseBurst(audio, at, 0.12, 0.08)
    tone(audio, 'triangle', freq, at, 0.6, peak)
    tone(audio, 'sine', freq * 2, at + 0.02, 0.45, peak * 0.42)
  })

  // Letter-roll ticks during 6→12s
  const rollTicks = Math.max(14, Math.round(ROLL_S / 0.35))
  for (let i = 0; i < rollTicks; i++) {
    const at = t0 + COUNT_S + (i / rollTicks) * ROLL_S
    tone(audio, 'square', 210 + i * 10, at, 0.07, 0.034 + i * 0.0012)
    tone(audio, 'sine', 420 + i * 7, at + 0.01, 0.11, 0.04)
  }

  // Winner lock — name + score together at WIN_AT
  const win = t0 + WIN_AT
  noiseBurst(audio, win, 0.55, 0.32)
  tone(audio, 'sine', 58, win, 2.2, 0.38)
  tone(audio, 'triangle', 523, win + 0.04, 1.8, 0.26)
  tone(audio, 'sine', 784, win + 0.08, 1.4, 0.18)
  ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(audio, 'triangle', freq, win + 0.12 + i * 0.1, 1.0, 0.14)
  })

  // Soft sustain under winner hold remainder
  const holdLeft = Math.max(1, d - WIN_AT - 1)
  tone(audio, 'sine', 52, win + 0.8, holdLeft, 0.08)

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
