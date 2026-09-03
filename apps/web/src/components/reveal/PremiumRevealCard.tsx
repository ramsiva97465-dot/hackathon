import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Crown, Medal, Award, ShieldCheck, Lock, Sparkles, Trophy } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'

const CIPHER_GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!#%*&?@$'

function randomChar() {
  return CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)]
}

const FINALIST_NODE_POSITIONS = [
  'left-1/2 top-0 -translate-x-1/2',
  'right-0 top-[31%]',
  'right-[13%] bottom-[5%]',
  'left-[13%] bottom-[5%]',
  'left-0 top-[31%]',
]

function FinalFiveVaultSeal() {
  return (
    <div
      className="relative h-24 w-24 sm:h-28 sm:w-28"
      role="img"
      aria-label="Five finalists secured for the winner reveal"
    >
      <div className="absolute inset-3 rounded-full bg-amber-400/20 blur-2xl" />
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-amber-300/35"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-amber-500/35"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute left-1/2 top-0 h-1 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-amber-200 to-transparent shadow-[0_0_12px_rgba(253,230,138,0.8)]" />
      </motion.div>

      {FINALIST_NODE_POSITIONS.map((position, index) => (
        <motion.span
          key={position}
          className={`absolute z-20 flex h-3 w-3 items-center justify-center rounded-full border border-amber-200/70 bg-[#211205] shadow-[0_0_12px_rgba(251,191,36,0.7)] ${position}`}
          animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.28, ease: 'easeInOut' }}
        >
          <span className="h-1 w-1 rounded-full bg-amber-200" />
        </motion.span>
      ))}

      <div className="absolute inset-[14px] flex items-center justify-center rounded-full border border-amber-300/45 bg-gradient-to-br from-amber-700/35 via-[#1A0D04] to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_30px_rgba(245,158,11,0.2)]">
        <svg viewBox="0 0 100 100" className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] text-amber-400/70" aria-hidden="true">
          <path
            d="M37 78C24 69 18 56 20 40M63 78c13-9 19-22 17-38"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[0, 1, 2, 3, 4].map((leaf) => (
            <g key={leaf}>
              <ellipse cx={22 + leaf * 2.8} cy={43 + leaf * 7.2} rx="2.2" ry="5" transform={`rotate(${-34 + leaf * 5} ${22 + leaf * 2.8} ${43 + leaf * 7.2})`} fill="currentColor" />
              <ellipse cx={78 - leaf * 2.8} cy={43 + leaf * 7.2} rx="2.2" ry="5" transform={`rotate(${34 - leaf * 5} ${78 - leaf * 2.8} ${43 + leaf * 7.2})`} fill="currentColor" />
            </g>
          ))}
        </svg>
        <Crown size={34} strokeWidth={1.8} className="relative z-10 text-amber-200 fill-amber-400/25 drop-shadow-[0_0_12px_rgba(251,191,36,0.65)]" />
      </div>
      <div className="absolute left-1/2 -bottom-7 flex w-36 -translate-x-1/2 flex-col items-center gap-1.5">
        <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/55 to-transparent" />
        <span className="font-mono text-[8px] font-black tracking-[0.32em] text-amber-300/80">
          FINAL FIVE
        </span>
        <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      </div>
    </div>
  )
}

const READY_PARTICLES = [
  ['7%', '18%', -18, 0], ['14%', '66%', 22, 0.4], ['23%', '12%', 35, 1.1],
  ['32%', '73%', -28, 0.8], ['67%', '15%', 24, 0.2], ['76%', '70%', -32, 1.3],
  ['86%', '24%', 18, 0.7], ['93%', '61%', -20, 1.6],
] as const

function FinaleReadyPodiums() {
  return (
    <div className="mt-6 w-full max-w-5xl">
      <div className="mb-4 flex items-center justify-center gap-5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/30" />
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.35em] text-amber-300/85">
          5 Champions · One Stage
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/30" />
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-6">
        {[1, 2, 3, 4, 5].map((place, index) => (
          <motion.div
            key={place}
            className="flex min-w-0 flex-col items-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 * index }}
          >
            <span className="mb-1 font-mono text-[10px] font-black text-amber-200/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]">{place}</span>
            <div className="relative aspect-[640/583] w-full">
              <motion.img
                src="/images/finale-podium.webp"
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                animate={{ filter: ['brightness(0.82)', 'brightness(1.12)', 'brightness(0.82)'] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.22, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl font-black text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] sm:text-4xl"
                animate={place <= 2 ? { opacity: [0.55, 1, 0.55] } : undefined}
                transition={place <= 2 ? { duration: 2.2, repeat: Infinity, delay: index * 0.25 } : undefined}
              >
                {place <= 2 ? '?' : place}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function triggerQualifierConfetti(rank: number) {
  try {
    if (rank === 1) {
      // Grand Champion dual cannon — gold & amber only
      const end = Date.now() + 4000
      const colors = ['#FFD700', '#F59E0B', '#FBBF24', '#FDE68A', '#FFFFFF', '#E83C00', '#FF6B00']
      ;(function frame() {
        confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors })
        confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    } else if (rank <= 3) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#F59E0B', '#FBBF24', '#FFFFFF', '#E83C00', '#FF8C00'],
      })
    } else {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FDE68A', '#FBBF24', '#FFFFFF', '#FF6B00'],
      })
    }
  } catch (_e) {
    // Non-blocking fallback
  }
}

// ─── Web Audio helpers ───────────────────────────────────────────────────────

let _sharedAudioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  try {
    if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
      _sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (_sharedAudioCtx.state === 'suspended') _sharedAudioCtx.resume()
    return _sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Plays a realistic mechanical split-flap letter-flip sound.
 * speedFactor: 0 = fast flutter, 1 = heavy tactile click
 */
function playMechanicalFlap(speedFactor: number) {
  const ctx = getAudioCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const duration = 0.022 + speedFactor * 0.04

  // 1. Crisp tactile plastic/metal flap strike (bandpass noise burst)
  const bufLen = Math.ceil(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.22))
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(3400 - speedFactor * 1400, now) // Crisp click
  filter.Q.value = 2.8

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.25 + speedFactor * 0.15, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now)

  // 2. Mechanical chassis body resonance ("tock")
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(320 - speedFactor * 100, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.03)

  oscGain.gain.setValueAtTime(0.18 + speedFactor * 0.12, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.04)
}

/**
 * Solid metallic latch lock sound when a letter locks into place.
 */
function playLatchLock() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(560, now)
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.07)

  gain.gain.setValueAtTime(0.4, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.085)
}

/**
 * Cinematic sub-bass heartbeat / tension riser pulse.
 */
function playTensionPulse(progress: number) {
  const ctx = getAudioCtx()
  if (!ctx) return
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(45 + progress * 40, now)
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.12)

  gain.gain.setValueAtTime(0.25 + progress * 0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.15)
}

/**
 * Dramatic cinematic reveal "lock-in" impact when the full team name is confirmed.
 */
function playRevealImpact() {
  const ctx = getAudioCtx()
  if (!ctx) return

  const now = ctx.currentTime

  // 1. Deep cinematic Subwoofer THUD (50Hz - 30Hz boom)
  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(140, now)
  sub.frequency.exponentialRampToValueAtTime(35, now + 0.4)
  subGain.gain.setValueAtTime(0.85, now)
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
  sub.connect(subGain)
  subGain.connect(ctx.destination)
  sub.start(now)
  sub.stop(now + 0.7)

  // 2. High metallic orchestral CHIME
  const chime = ctx.createOscillator()
  const chimeGain = ctx.createGain()
  chime.type = 'sine'
  chime.frequency.setValueAtTime(960, now)
  chimeGain.gain.setValueAtTime(0.4, now)
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
  chime.connect(chimeGain)
  chimeGain.connect(ctx.destination)
  chime.start(now + 0.02)
  chime.stop(now + 0.95)
}

export interface PremiumRevealCardProps {
  isFinale: boolean
  currentSpotlightRank: number
  currentSpotlightTeam: {
    teamId: string
    teamName: string
    college?: string
    track?: string
    totalScore: number
  } | null
  revealedStep: number
  maxSteps: number
  isDecrypting: boolean
  decryptingRank: number | null
  revealingTeamName: string
  nameSpinMs: number
  /** Shrink the hero card once every place is announced so the table can sit below it. */
  settled?: boolean
}

export function PremiumRevealCard({
  isFinale,
  currentSpotlightRank,
  currentSpotlightTeam,
  revealedStep,
  maxSteps,
  isDecrypting,
  decryptingRank,
  revealingTeamName,
  nameSpinMs = 5000,
  settled = false,
}: PremiumRevealCardProps) {
  const activeRank = isDecrypting && decryptingRank != null ? decryptingRank : currentSpotlightRank
  const targetName = (revealingTeamName || currentSpotlightTeam?.teamName || '').toUpperCase()

  const [scrambleDisplay, setScrambleDisplay] = useState('VOICEATHON')
  const [rollingScore, setRollingScore] = useState('00.0')
  const [justLocked, setJustLocked] = useState(false)
  const [revealProgress, setRevealProgress] = useState(0)
  const nameBoxRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const [nameScale, setNameScale] = useState(1)
  const prevDecrypting = useRef(isDecrypting)
  const isDecryptingRef = useRef(isDecrypting)
  const frameCountRef = useRef(0)
  const lockedCharsRef = useRef(0)

  // Keep ref in sync so the setTimeout closure always reads the latest value
  useEffect(() => { isDecryptingRef.current = isDecrypting }, [isDecrypting])

  const displayedName = isDecrypting
    ? (scrambleDisplay || 'VOICEATHON')
    : (currentSpotlightTeam?.teamName || targetName).toUpperCase()

  // The name is monospace, so its width tracks the character count exactly. Measure the
  // natural width once per length change and scale the line down so long names never clip.
  // A transform is used rather than a font-size step so the fit is exact at any length.
  useLayoutEffect(() => {
    const fit = () => {
      const el = nameRef.current
      const box = nameBoxRef.current
      if (!el || !box) return
      const natural = el.scrollWidth
      const available = box.clientWidth
      if (!natural || !available) return
      setNameScale(Math.min(1, available / natural))
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [displayedName.length])

  useEffect(() => {
    if (!isDecrypting) {
      if (prevDecrypting.current) {
        // Just finished — dramatic lock-in
        setRevealProgress(1)
        setJustLocked(true)
        playRevealImpact()
        if (isFinale) {
          triggerQualifierConfetti(activeRank)
        }
        const t = setTimeout(() => setJustLocked(false), 1400)
        return () => clearTimeout(t)
      }
      prevDecrypting.current = false
      return
    }

    prevDecrypting.current = true
    setRevealProgress(0)
    isDecryptingRef.current = true
    const startTime = Date.now()
    const initialWord = 'VOICEATHON'
    const targetLen = Math.max(initialWord.length, targetName.length || initialWord.length)
    frameCountRef.current = 0
    lockedCharsRef.current = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      if (!isDecryptingRef.current) return   // stopped externally

      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / nameSpinMs)
      setRevealProgress(progress)

      // ── Dramatic Suspense Curve: Fast rolling -> Edge-of-seat crawl on final letters ──
      // Accelerates suspense: speedFactor climbs with power curve (progress^0.65)
      // interval: 45 ms (rolling) → 260 ms (heavy, dramatic clicks on the final letters)
      const speedFactor = Math.pow(progress, 0.65)
      const nextMs = Math.round(45 + (260 - 45) * speedFactor)

      // ── Sequential Cascade Scramble (V scrolls first, then O, then I... in a cascading wave) ────
      const initialWord = 'VOICEATHON'
      const target = (targetName || 'QUALIFIER').toUpperCase()
      const maxLen = Math.max(initialWord.length, target.length)
      // Keep one non-space character encrypted until the shared decrypt timer
      // ends. Otherwise the full name can become readable around 85% while
      // the score continues calculating until 100%.
      const finalRevealIndex = Math.max(0, target.trimEnd().length - 1)
      const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

      let chars = ''
      let newLockedCount = 0

      // Finale identities remain unreadable for most of the countdown, then
      // lock rapidly near the impact. Top 20 keeps its familiar cascade.
      const lengthStart = isFinale ? 0.58 : 0.40
      const lengthDuration = isFinale ? 0.24 : 0.45
      const lengthProgress = Math.min(1, Math.max(0, (progress - lengthStart) / lengthDuration))
      const currentDisplayLen = Math.round(initialWord.length + (target.length - initialWord.length) * lengthProgress)

      for (let i = 0; i < currentDisplayLen; i++) {
        const startChar = i < initialWord.length ? initialWord[i] : (target[i] || 'A')
        const targetChar = i < target.length ? target[i] : ''

        const finaleCharStart = 0.68 + (i / maxLen) * 0.20
        const standardCharStart = 0.05 + (i / maxLen) * 0.52
        const charStart = isFinale ? finaleCharStart : standardCharStart
        const charLock = charStart + (isFinale ? 0.10 : 0.25)

        if (targetChar === ' ' && progress >= charStart) {
          chars += ' '
          continue
        }

        const startIdx = ALPHABET.indexOf(startChar) >= 0 ? ALPHABET.indexOf(startChar) : 0
        const targetIdx = targetChar && ALPHABET.indexOf(targetChar) >= 0 ? ALPHABET.indexOf(targetChar) : 0

        const canLockCharacter = i !== finalRevealIndex || progress >= 1

        if ((progress >= charLock || progress >= 0.98) && canLockCharacter) {
          // Locked onto target team name character
          if (targetChar) {
            chars += targetChar
            newLockedCount++
          }
        } else if (progress < charStart) {
          // Finale uses a constantly changing cipher so no letter can reveal
          // the team's identity before the final lock sequence.
          chars += isFinale
            ? CIPHER_GLYPHS[(frameCountRef.current + i * 7) % CIPHER_GLYPHS.length]
            : startChar
        } else {
          // Actively scrolling through A-Z starting from startChar towards targetChar
          const spinProgress = (progress - charStart) / (isFinale ? 0.10 : 0.25)
          const totalFlips = 26 + ((targetIdx - startIdx + 26) % 26)
          const currentStep = Math.floor(spinProgress * totalFlips)
          const currentLetter = ALPHABET[(startIdx + currentStep + (frameCountRef.current % 3)) % 26]
          chars += currentLetter
        }
      }
      setScrambleDisplay(chars)

      // Rolling fake score (fluctuates during suspense)
      setRollingScore((Math.random() * 80 + 15).toFixed(1))

      // ── Realistic Mechanical Sound Synthesis & Suspense Pulses ─────────────
      // Play crisp mechanical flap click on every active step
      playMechanicalFlap(speedFactor)

      // Play suspenseful sub-bass heartbeat every 6 frames
      if (frameCountRef.current % 6 === 0 && progress > 0.15 && progress < 0.92) {
        playTensionPulse(progress)
      }
      frameCountRef.current++

      // Play metallic latch lock click whenever a new character locks in
      if (newLockedCount > lockedCharsRef.current) {
        playLatchLock()
        lockedCharsRef.current = newLockedCount
      }

      if (progress < 1) {
        timeoutId = setTimeout(tick, nextMs)
      }
    }

    timeoutId = setTimeout(tick, 16)    // start immediately
    return () => clearTimeout(timeoutId)
  }, [isDecrypting, targetName, nameSpinMs, activeRank, isFinale])

  const finaleSecondsRemaining = Math.max(1, Math.ceil(((1 - revealProgress) * nameSpinMs) / 1000))
  const finaleSuspenseLabel = revealProgress < 0.34
    ? 'FINALIST IDENTITY SECURED'
    : revealProgress < 0.68
    ? 'THE VAULT IS OPENING'
    : revealProgress < 0.9
    ? 'BREAKING THE FINAL SEAL'
    : 'PREPARE FOR THE REVEAL'

  // ─── READY STATE ────────────────────────────────────────────────────────────
  if (revealedStep === 0 && !isDecrypting) {
    return (
      <div className="relative w-full">
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-2 rounded-[2.5rem] blur-3xl pointer-events-none transition-opacity duration-700 opacity-60 bg-gradient-to-r from-amber-600/20 via-orange-500/15 to-amber-600/20" />

        <motion.div
          key="ready-state"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`relative px-10 py-8 sm:py-10 xl:py-12 rounded-[2.5rem] overflow-hidden border-2 transition-all shadow-[0_30px_80px_rgba(0,0,0,0.9)] ${
            isFinale
              ? 'bg-gradient-to-b from-[#1F140A] via-[#120B05] to-[#080503] border-amber-500/60 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_80px_rgba(245,158,11,0.25)]'
              : 'bg-gradient-to-b from-[#1A1510] via-[#100D09] to-[#080604] border-amber-600/40 shadow-[0_30px_80px_rgba(0,0,0,0.9)]'
          }`}
        >
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          {isFinale && READY_PARTICLES.map(([left, top, rotate, delay], index) => (
            <motion.span
              key={`${left}-${top}`}
              aria-hidden
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-sm bg-amber-400/45 shadow-[0_0_8px_rgba(245,158,11,0.45)]"
              style={{ left, top, rotate }}
              animate={{ y: [0, -10, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 3.2 + index * 0.12, repeat: Infinity, delay, ease: 'easeInOut' }}
            />
          ))}

          {/* ─── EXACT SAME HEIGHT & WIDTH INNER CONTAINER ─── */}
          <div className={`relative z-10 flex flex-col items-center justify-center text-center w-full my-auto pt-1 pb-2 ${
            isFinale ? 'min-h-[390px]' : 'min-h-[260px]'
          }`}>
            {isFinale ? (
              <div className="mb-10">
                <FinalFiveVaultSeal />
              </div>
            ) : (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
                <div className="absolute inset-1 rounded-full bg-amber-400/20 blur-xl" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/25 via-amber-950/60 to-orange-950/80 border border-amber-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_35px_rgba(245,158,11,0.22)]" />
                <div className="absolute inset-2 rounded-full border border-amber-200/15" />
                <>
                  <Trophy size={40} strokeWidth={1.7} className="relative z-10 text-amber-300 fill-amber-400/10 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" />
                  <Sparkles size={12} className="absolute right-1 top-1 text-amber-200 animate-pulse" />
                </>
              </div>
            )}

            {/* Handcrafted Luxury Stage Ready Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-4 bg-gradient-to-r from-amber-950/90 via-[#1A0E05] to-amber-950/90 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-900/30 ring-1 ring-amber-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span>{isFinale ? 'GRAND FINALE • WINNER REVEAL' : 'STAGE READY · TOP 20 CEREMONY'}</span>
            </div>

            {/* Heading */}
            <h3 className="text-3xl sm:text-4xl font-black mb-2.5 text-white tracking-tight">
              {isFinale ? '👑 The Champions Await' : 'Round 1 Graded & Verified'}
            </h3>
            <p className="max-w-xl mx-auto text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              {isFinale
                ? '5 Winners. One Unforgettable Reveal !!'
                : 'Waiting for admin to initiate the Top 20 announcement (#20 ➔ #1).'}
            </p>
            {isFinale && <FinaleReadyPodiums />}
          </div>

          {/* Footnote divider */}
          <div className="w-full pt-7 mt-7 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400 tracking-wider">
            <span>{isFinale ? 'Status: Vault Sealed' : 'Status: Ready'}</span>
            <span>Next: {isFinale ? 'Unseal 5th Place' : '#20'}</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── RANK THEME (no green anywhere) ─────────────────────────────────────────
  const trackConfig = currentSpotlightTeam?.track ? getTrackConfig(currentSpotlightTeam.track) : null
  const isChampion = activeRank === 1

  const rankTheme = isChampion
    ? {
        badge: 'bg-gradient-to-r from-orange-600 via-[#E83C00] to-orange-600 text-white border border-orange-400/60 ring-2 ring-orange-500/40 shadow-lg shadow-orange-900/40',
        rankText:
          'text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-300 drop-shadow-[0_0_50px_rgba(232,60,0,0.8)]',
        cardBorder: 'border-white/10',
        cardBg: 'bg-gradient-to-b from-[#2E1205] via-[#1A0A02] to-[#0D0501]',
        glow: 'bg-transparent',
        scoreTxt: 'text-orange-200',
        nameColor: 'text-white',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : activeRank === 2
    ? {
        badge: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-slate-100 border border-slate-400/50 ring-1 ring-slate-400/20 shadow-md',
        rankText: 'text-slate-200 drop-shadow-[0_0_40px_rgba(203,213,225,0.6)]',
        cardBorder: 'border-white/10',
        cardBg: 'bg-gradient-to-b from-[#1C1A18] via-[#111010] to-[#090808]',
        glow: 'bg-transparent',
        scoreTxt: 'text-slate-200',
        nameColor: 'text-white',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : activeRank === 3
    ? {
        badge: 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-200 border border-amber-600/50 ring-1 ring-amber-500/20 shadow-md',
        rankText: 'text-orange-200 drop-shadow-[0_0_40px_rgba(232,60,0,0.6)]',
        cardBorder: 'border-white/10',
        cardBg: 'bg-gradient-to-b from-[#1F1508] via-[#110D05] to-[#080601]',
        glow: 'bg-transparent',
        scoreTxt: 'text-orange-200',
        nameColor: 'text-amber-100',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : {
        // Ranks 4–20: deep obsidian + warm gold amber — NO green
        badge: 'bg-gradient-to-r from-amber-950/90 via-[#1A0E05] to-amber-950/90 text-amber-200 border border-amber-500/40 ring-1 ring-amber-500/20 shadow-md',
        rankText: 'text-orange-300 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]',
        cardBorder: 'border-white/10',
        cardBg: 'bg-gradient-to-b from-[#1A1510] via-[#100D09] to-[#080604]',
        glow: 'bg-transparent',
        scoreTxt: 'text-orange-200',
        nameColor: 'text-white',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }

  return (
    <div className="relative w-full">
      {/* Ambient Backlight Glow */}
      <div
        className={`absolute -inset-2 rounded-[2.5rem] blur-3xl pointer-events-none transition-opacity duration-700 ${
          isDecrypting
            ? `opacity-90 ${rankTheme.glow} animate-pulse`
            : `opacity-60 ${rankTheme.glow}`
        }`}
      />

      {isFinale && isDecrypting && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/15"
            animate={{ scale: [0.82, 1.08], opacity: [0.55, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[145%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-400/10"
            animate={{ scale: [0.74, 1.04], opacity: [0.4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.7, ease: 'easeOut' }}
          />
        </>
      )}

      <motion.div
        key={`spotlight-card-${activeRank}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={justLocked && isFinale
          ? { opacity: 1, scale: [0.985, 1.025, 1] }
          : { opacity: 1, scale: 1 }}
        transition={justLocked && isFinale
          ? { duration: 0.65, times: [0, 0.35, 1], ease: 'easeOut' }
          : { duration: 0.4, ease: 'easeOut' }}
        className={`relative rounded-[2.5rem] overflow-hidden border-2 transition-all ${
          settled
            ? 'px-8 pt-6 pb-4 sm:pt-7 sm:pb-5'
            : 'px-10 py-8 sm:py-10 xl:py-12'
        } ${rankTheme.cardBg} ${
          isDecrypting
            ? isFinale
              ? 'border-amber-400/45 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_70px_rgba(245,158,11,0.22)]'
              : 'border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9)]'
            : `${rankTheme.cardBorder} ${rankTheme.cardShadow}`
        }`}
      >
        {isFinale && isDecrypting && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.14),transparent_52%)]" />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-orange-500 via-amber-200 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.9)]"
              style={{ scaleX: revealProgress }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/25 bg-black/45 px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 backdrop-blur-md">
                <Lock size={11} className="text-amber-400" />
                <span>{finaleSuspenseLabel}</span>
                <span className="h-3 w-px bg-amber-400/25" />
                <span className="tabular-nums text-white">T−{String(finaleSecondsRemaining).padStart(2, '0')}</span>
              </div>
            </div>
          </>
        )}

        {justLocked && isFinale && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-amber-100"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-3 z-20 rounded-[2rem] border-2 border-amber-200"
              initial={{ opacity: 1, scale: 0.96 }}
              animate={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </>
        )}

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Laser scan beam */}
        {isDecrypting && (
          <motion.div
            aria-hidden
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2.2, ease: 'linear', repeat: Infinity }}
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent mix-blend-screen"
          />
        )}

        {/* ─── HORIZONTAL 3-COLUMN LAYOUT for 24:10 wide LED ─────────────────── */}
        <div className={`flex items-center gap-6 w-full ${settled ? 'min-h-[140px]' : 'min-h-[260px]'}`}>

          {/* ── LEFT: Badge + Rank ── */}
          <div className={`flex flex-col items-center justify-start self-stretch shrink-0 min-w-[160px] px-2 ${
            settled ? 'gap-2 pt-1' : 'gap-4 pt-3'
          }`}>
            {/* Badge */}
            <div
              className={`inline-flex min-h-[26px] items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] shadow-xl transition-all ${
                isDecrypting
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/30'
                  : rankTheme.badge
              }`}
            >
              {isDecrypting ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                </span>
              ) : isChampion ? (
                <Crown size={13} className="text-amber-200 fill-amber-200 shrink-0" />
              ) : activeRank === 2 ? (
                <Medal size={13} className="text-slate-200 shrink-0" />
              ) : activeRank === 3 ? (
                <Award size={13} className="text-amber-200 shrink-0" />
              ) : (
                <ShieldCheck size={13} className="text-amber-400 shrink-0" />
              )}
              <span className="whitespace-nowrap tracking-[0.16em] font-extrabold">
                {isDecrypting
                  ? `UNSEALING #${activeRank}`
                  : !isFinale
                  ? 'Qualified'
                  : isChampion
                  ? '1ST PLACE'
                  : activeRank === 2
                  ? '2ND PLACE'
                  : activeRank === 3
                  ? '3RD PLACE'
                  : 'QUALIFIED'}
              </span>
            </div>

            {/* Rank Number — Crisp metallic gold typography */}
            <div
              className={`font-black tracking-tighter leading-none transition-colors duration-300 ${
                settled ? 'text-[3.25rem] xl:text-[4rem]' : 'mt-2 text-[4.5rem] xl:text-[6rem]'
              } ${
                isDecrypting
                  ? 'text-amber-400/90 font-mono animate-pulse'
                  : rankTheme.rankText
              }`}
            >
              #{activeRank}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="w-px self-stretch bg-white/10 shrink-0" />

          {/* ── CENTER: Team Name + College/Track ── */}
          <div className={`flex-1 flex flex-col items-center justify-center gap-3 text-center overflow-hidden px-6 ${
            settled ? 'min-h-0' : 'min-h-[160px] translate-y-2'
          }`}>
            {/* Team Name / Cipher (Persistent single line element, zero layout jump or popping) */}
            <div ref={nameBoxRef} className="w-full flex justify-center overflow-hidden">
              <h2
                ref={nameRef}
                style={{ transform: `scale(${nameScale})`, transformOrigin: 'center' }}
                className={`font-mono font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-[0_0_30px_rgba(232,60,0,0.6)] select-none whitespace-nowrap w-max leading-tight ${
                  settled ? 'text-2xl xl:text-4xl' : 'text-3xl xl:text-5xl'
                }`}
              >
                {displayedName}
              </h2>
            </div>

            {/* Subtitle Slot (Decrypting badge cross-fades into College & Track smoothly) */}
            <div className="min-h-[36px] flex items-center justify-center">
              {isDecrypting ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-[#1A1208]/90 to-orange-500/15 backdrop-blur-md border border-amber-400/40 text-amber-200/95 text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/20">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"></span>
                  </span>
                  <span>{isFinale ? finaleSuspenseLabel : 'VERIFYING OFFICIAL EVALUATION MARKS'}</span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-center justify-center gap-3 flex-wrap text-lg xl:text-xl font-medium text-slate-300"
                >
                  <span className="font-semibold text-white/90">
                    {currentSpotlightTeam?.college || 'Tamil Nadu'}
                  </span>
                  {trackConfig && (
                    <>
                      <span className="opacity-40 text-xl">·</span>
                      <span
                        className="px-3 py-1 rounded-lg text-sm font-black uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${trackConfig.color}20`,
                          color: trackConfig.color,
                          borderColor: `${trackConfig.color}50`,
                        }}
                      >
                        {trackConfig.label}
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="w-px self-stretch bg-white/10 shrink-0" />

          {/* ── RIGHT: Score ── */}
          <div className={`flex flex-col items-center justify-start self-stretch shrink-0 w-[20%] ${
            settled ? 'gap-2 pt-1' : 'gap-4 pt-3'
          }`}>
            <span className="inline-flex min-h-[26px] items-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-300/90">
              {isDecrypting ? 'CALCULATING' : isFinale ? 'FINAL SCORE' : 'ROUND 1 SCORE'}
            </span>
            <span
              className={`font-black font-mono tracking-wider leading-none ${
                settled ? 'text-[2.5rem] xl:text-[3.5rem]' : 'mt-2 text-[3.5rem] xl:text-[5rem]'
              } ${isDecrypting ? 'text-amber-300/80 animate-pulse' : rankTheme.scoreTxt}`}
            >
              {isDecrypting ? rollingScore : Number(currentSpotlightTeam?.totalScore || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* ── Progress Footnote ── */}
        <div className={`${settled ? 'mt-4 pt-3' : 'mt-6 pt-5'} border-t border-white/10 flex items-center justify-between text-sm font-semibold px-4 text-slate-400`}>
          <span className="font-mono">
            Progress: {revealedStep} of {maxSteps} announced
          </span>
          {revealedStep !== maxSteps && (
            <span className={isFinale || isChampion ? 'text-amber-300 font-bold' : 'text-slate-300 font-bold'}>
              {`Next: #${activeRank > 1 ? activeRank - 1 : 1}`}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}
