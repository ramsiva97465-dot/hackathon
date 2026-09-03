import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Crown, Medal, Award, ShieldCheck, Lock, Sparkles, Trophy } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'

const CIPHER_GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!#%*&?@$'

function randomChar() {
  return CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)]
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
 * Dramatic reveal "lock-in" thud when the name is fully decrypted.
 */
function playRevealImpact() {
  const ctx = getAudioCtx()
  if (!ctx) return

  const now = ctx.currentTime

  // Low THUD — sine sweep down
  const thud = ctx.createOscillator()
  const thudGain = ctx.createGain()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(180, now)
  thud.frequency.exponentialRampToValueAtTime(55, now + 0.25)
  thudGain.gain.setValueAtTime(0.7, now)
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  thud.connect(thudGain)
  thudGain.connect(ctx.destination)
  thud.start(now)
  thud.stop(now + 0.55)

  // High metallic TING — decaying sine at 880 Hz
  const ting = ctx.createOscillator()
  const tingGain = ctx.createGain()
  ting.type = 'sine'
  ting.frequency.setValueAtTime(880, now)
  tingGain.gain.setValueAtTime(0.35, now)
  tingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
  ting.connect(tingGain)
  tingGain.connect(ctx.destination)
  ting.start(now + 0.02)
  ting.stop(now + 0.85)
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
}: PremiumRevealCardProps) {
  const activeRank = isDecrypting && decryptingRank != null ? decryptingRank : currentSpotlightRank
  const targetName = (revealingTeamName || currentSpotlightTeam?.teamName || '').toUpperCase()

  const [scrambleDisplay, setScrambleDisplay] = useState('VOICEATHON')
  const [rollingScore, setRollingScore] = useState('00.0')
  const [justLocked, setJustLocked] = useState(false)
  const prevDecrypting = useRef(isDecrypting)
  const isDecryptingRef = useRef(isDecrypting)
  const frameCountRef = useRef(0)
  const lockedCharsRef = useRef(0)

  // Keep ref in sync so the setTimeout closure always reads the latest value
  useEffect(() => { isDecryptingRef.current = isDecrypting }, [isDecrypting])

  useEffect(() => {
    if (!isDecrypting) {
      if (prevDecrypting.current) {
        // Just finished — dramatic lock-in
        setJustLocked(true)
        playRevealImpact()
        triggerQualifierConfetti(activeRank)
        const t = setTimeout(() => setJustLocked(false), 1400)
        return () => clearTimeout(t)
      }
      prevDecrypting.current = false
      return
    }

    prevDecrypting.current = true
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

      // ── Speed curve: fast → slow (Slower, tactile, suspenseful flip pace) ──
      // interval: 45 ms (crisp visible rolling) → 220 ms (suspenseful slow-motion crawl)
      const speedFactor = Math.pow(progress, 0.45)
      const nextMs = Math.round(45 + (220 - 45) * speedFactor)

      // ── Character scramble (Always shows full VOICEATHON initially, then morphs to target team name) ────
      const initialWord = 'VOICEATHON'
      const target = (targetName || 'QUALIFIER').toUpperCase()
      const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

      let chars = ''
      let newLockedCount = 0

      if (progress < 0.18) {
        // 100% full complete VOICEATHON word shown initially
        chars = initialWord
      } else {
        // Smoothly transition display length from initialWord.length (10) to target.length
        const lenProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.40))
        const currentLen = Math.round(initialWord.length + (target.length - initialWord.length) * lenProgress)
        const displayLen = Math.max(1, currentLen)

        for (let i = 0; i < displayLen; i++) {
          const targetChar = i < target.length ? target[i] : ''
          const startChar = i < initialWord.length ? initialWord[i] : 'A'

          if (targetChar === ' ') {
            chars += ' '
            continue
          }

          const startIdx = ALPHABET.indexOf(startChar) >= 0 ? ALPHABET.indexOf(startChar) : 0
          const targetIdx = targetChar && ALPHABET.indexOf(targetChar) >= 0 ? ALPHABET.indexOf(targetChar) : 0

          // Column i lock-in timing: Progressive left-to-right
          const colLockProgress = Math.min(1, Math.max(0, (progress - 0.25 - (i / Math.max(1, target.length)) * 0.45) / 0.30))

          if (colLockProgress >= 1 || progress >= 0.98) {
            if (targetChar) {
              chars += targetChar
              newLockedCount++
            }
          } else {
            // Flip forward through A-Z starting from startChar towards targetChar with independent rhythm
            const totalCycles = 26 + ((targetIdx - startIdx + 26) % 26)
            const currentStep = Math.floor(colLockProgress * totalCycles)
            const currentLetter = ALPHABET[(startIdx + currentStep + (frameCountRef.current * 2 + i * 5)) % 26]
            chars += currentLetter
          }
        }
      }
      setScrambleDisplay(chars)

      // Rolling fake score
      setRollingScore((Math.random() * 80 + 15).toFixed(1))

      // ── Realistic Mechanical Sound Synthesis ──────────────────────────────
      // Play crisp mechanical flap click on every active step
      playMechanicalFlap(speedFactor)
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
  }, [isDecrypting, targetName, nameSpinMs, activeRank])

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
          className={`relative px-10 pt-14 pb-8 sm:pt-16 sm:pb-10 xl:pt-20 xl:pb-12 rounded-[2.5rem] overflow-hidden border-2 transition-all shadow-[0_30px_80px_rgba(0,0,0,0.9)] ${
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

          {/* ─── EXACT SAME HEIGHT & WIDTH INNER CONTAINER ─── */}
          <div className="flex flex-col items-center justify-center text-center w-full min-h-[260px] my-auto pt-1 pb-2">
            {/* Trophy icon — elevated with clean breathing room */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner relative bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {isFinale ? (
                <>
                  <Crown size={36} className="text-amber-400 animate-bounce" />
                  <div className="absolute inset-0 rounded-2xl border border-amber-400/50 animate-ping opacity-30" />
                </>
              ) : (
                <>
                  <Trophy size={36} className="text-amber-400" />
                  <div className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-ping opacity-25" />
                </>
              )}
            </div>

            {/* Handcrafted Luxury Stage Ready Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-4 bg-gradient-to-r from-amber-950/90 via-[#1A0E05] to-amber-950/90 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-900/30 ring-1 ring-amber-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span>STAGE READY · TOP 20 CEREMONY</span>
            </div>

            {/* Heading */}
            <h3 className="text-3xl sm:text-4xl font-black mb-2.5 text-white tracking-tight">
              {isFinale ? '👑 Grand Finale Verdict Sealed' : 'Round 1 Graded & Verified'}
            </h3>
            <p className="max-w-xl mx-auto text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              {isFinale
                ? 'Waiting for admin to unseal 5th Place. Each place opens only when triggered.'
                : 'Waiting for admin to initiate the Top 20 announcement (#20 ➔ #1).'}
            </p>
          </div>

          {/* Footnote divider */}
          <div className="w-full pt-7 mt-7 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400 tracking-wider">
            <span>Status: Ready</span>
            <span>Next: {isFinale ? '5th Place' : '#20'}</span>
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
        cardBorder: 'border-[#E83C00] ring-4 ring-orange-500/50',
        cardBg: 'bg-gradient-to-b from-[#2E1205] via-[#1A0A02] to-[#0D0501]',
        glow: 'bg-gradient-to-r from-orange-500/40 via-[#E83C00]/50 to-orange-500/40',
        scoreTxt: 'text-orange-200',
        nameColor: 'text-white',
        cardShadow: 'shadow-[0_0_100px_rgba(232,60,0,0.6)]',
      }
    : activeRank === 2
    ? {
        badge: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-slate-100 border border-slate-400/50 ring-1 ring-slate-400/20 shadow-md',
        rankText: 'text-slate-200 drop-shadow-[0_0_40px_rgba(203,213,225,0.6)]',
        cardBorder: 'border-slate-500/60',
        cardBg: 'bg-gradient-to-b from-[#1C1A18] via-[#111010] to-[#090808]',
        glow: 'bg-gradient-to-r from-slate-400/25 via-white/20 to-slate-400/25',
        scoreTxt: 'text-slate-200',
        nameColor: 'text-white',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : activeRank === 3
    ? {
        badge: 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-200 border border-amber-600/50 ring-1 ring-amber-500/20 shadow-md',
        rankText: 'text-orange-200 drop-shadow-[0_0_40px_rgba(232,60,0,0.6)]',
        cardBorder: 'border-amber-700/60',
        cardBg: 'bg-gradient-to-b from-[#1F1508] via-[#110D05] to-[#080601]',
        glow: 'bg-gradient-to-r from-amber-700/30 via-orange-500/25 to-amber-700/30',
        scoreTxt: 'text-orange-200',
        nameColor: 'text-amber-100',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : {
        // Ranks 4–20: deep obsidian + warm gold amber — NO green
        badge: 'bg-gradient-to-r from-amber-950/90 via-[#1A0E05] to-amber-950/90 text-amber-200 border border-amber-500/40 ring-1 ring-amber-500/20 shadow-md',
        rankText: 'text-orange-300 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]',
        cardBorder: 'border-amber-600/40',
        cardBg: 'bg-gradient-to-b from-[#1A1510] via-[#100D09] to-[#080604]',
        glow: 'bg-gradient-to-r from-amber-600/20 via-orange-500/15 to-amber-600/20',
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

      <motion.div
        key={`spotlight-card-${activeRank}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative px-10 pt-14 pb-8 sm:pt-16 sm:pb-10 xl:pt-20 xl:pb-12 rounded-[2.5rem] overflow-hidden border-2 transition-all
          ${rankTheme.cardBg}
          ${isDecrypting ? 'border-amber-500/80 shadow-[0_0_100px_rgba(245,158,11,0.45)]' : `${rankTheme.cardBorder} ${rankTheme.cardShadow}`}
        `}
      >
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
        <div className="flex items-center gap-6 w-full min-h-[260px]">

          {/* ── LEFT: Badge + Rank ── */}
          <div className="flex flex-col items-center justify-center gap-2 shrink-0 min-w-[160px] px-2">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] shadow-xl transition-all ${
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
                  : isChampion
                  ? (isFinale ? '1ST PLACE' : '#1 SEED')
                  : activeRank === 2
                  ? (isFinale ? '2ND PLACE' : '#2 SEED')
                  : activeRank === 3
                  ? (isFinale ? '3RD PLACE' : '#3 SEED')
                  : 'QUALIFIED'}
              </span>
            </div>

            {/* Rank Number — Crisp metallic gold typography */}
            <div
              className={`font-black tracking-tighter leading-none text-[4.5rem] xl:text-[6rem] transition-colors duration-300 ${
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
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center overflow-hidden px-6 min-h-[160px]">
            {/* Team Name / Cipher (Persistent single line element, zero layout jump or popping) */}
            <h2 className="font-mono text-3xl xl:text-5xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-[0_0_30px_rgba(232,60,0,0.6)] select-none whitespace-nowrap overflow-hidden max-w-full leading-tight">
              {isDecrypting
                ? (scrambleDisplay || 'VOICEATHON')
                : (currentSpotlightTeam?.teamName || targetName).toUpperCase()
              }
            </h2>

            {/* Subtitle Slot (Decrypting badge cross-fades into College & Track smoothly) */}
            <div className="min-h-[36px] flex items-center justify-center">
              {isDecrypting ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-500/30 text-amber-300/90 text-xs font-mono tracking-[0.16em] uppercase shadow-sm">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <span>VERIFYING OFFICIAL EVALUATION MARKS</span>
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
          <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[20%]">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300/80 font-mono">
              {isDecrypting ? 'CALCULATING' : isFinale ? 'FINAL SCORE' : 'ROUND 1 SCORE'}
            </span>
            <span
              className={`text-[3.5rem] xl:text-[5rem] font-black font-mono tracking-wider leading-none ${
                isDecrypting ? 'text-amber-300/80 animate-pulse' : rankTheme.scoreTxt
              }`}
            >
              {isDecrypting ? rollingScore : Number(currentSpotlightTeam?.totalScore || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* ── Progress Footnote ── */}
        <div className="mt-8 pt-7 border-t border-white/10 flex items-center justify-between text-sm font-semibold px-4 text-slate-400">
          <span className="font-mono">
            Progress: {revealedStep} of {maxSteps} announced
          </span>
          <span className={isFinale || isChampion ? 'text-amber-300 font-bold' : 'text-slate-300 font-bold'}>
            {revealedStep === maxSteps
              ? '🎉 Ceremony Complete'
              : `Next: #${activeRank > 1 ? activeRank - 1 : 1}`}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
