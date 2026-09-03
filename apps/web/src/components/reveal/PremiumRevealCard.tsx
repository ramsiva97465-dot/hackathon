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
 * Plays a mechanical tick / cipher-click sound.
 * speedFactor: 0 = blazing fast (light tap), 1 = very slow (heavy clunk)
 */
function playTick(speedFactor: number) {
  const ctx = getAudioCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const duration = 0.025 + speedFactor * 0.06  // 25–85 ms click length

  // White-noise burst shaped into a sharp percussive tap
  const bufLen = Math.ceil(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) {
    // Exponential decay envelope on the noise
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.18))
  }

  const src = ctx.createBufferSource()
  src.buffer = buf

  // Band-pass filter: high-pitched fast clicks, lower "clunk" when slow
  const bpf = ctx.createBiquadFilter()
  bpf.type = 'bandpass'
  bpf.frequency.value = 2200 - speedFactor * 1400   // 2200 Hz → 800 Hz
  bpf.Q.value = 1.8

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.12 + speedFactor * 0.22, now) // louder when slow

  src.connect(bpf)
  bpf.connect(gain)
  gain.connect(ctx.destination)
  src.start(now)
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

  const [scrambleDisplay, setScrambleDisplay] = useState('')
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
    const targetLen = Math.max(8, targetName.length || 10)
    frameCountRef.current = 0
    lockedCharsRef.current = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      if (!isDecryptingRef.current) return   // stopped externally

      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / nameSpinMs)

      // ── Speed curve: fast → slow ─────────────────────────────────────────
      // progress^0.45 gives strong deceleration (slot-machine feel)
      // interval: 16 ms (60 fps blaze) → 170 ms (suspenseful crawl)
      const speedFactor = Math.pow(progress, 0.45)
      const nextMs = Math.round(16 + (170 - 16) * speedFactor)

      // ── Character scramble ───────────────────────────────────────────────
      const lockThreshold = 0.62
      let chars = ''
      let newLockedCount = 0
      for (let i = 0; i < targetLen; i++) {
        const charProgress = (progress - lockThreshold) / (1 - lockThreshold)
        const charLockIdx = Math.floor(charProgress * targetLen)
        if (progress >= lockThreshold && i <= charLockIdx && targetName[i]) {
          chars += targetName[i]
          newLockedCount++
        } else if (targetName[i] === ' ') {
          chars += ' '
        } else {
          chars += randomChar()
        }
      }
      setScrambleDisplay(chars)

      // Rolling fake score
      setRollingScore((Math.random() * 80 + 15).toFixed(1))

      // ── Sound ─────────────────────────────────────────────────────────────
      // Fast phase: play every 4th frame to avoid audio overload
      // Slow phase: play every frame for maximum suspense
      const fc = frameCountRef.current
      const playEveryN = progress < 0.3 ? 4 : progress < 0.6 ? 2 : 1
      if (fc % playEveryN === 0) {
        playTick(speedFactor)
      }
      frameCountRef.current++

      // Per-character lock-in click (heavier clunk each time a new letter resolves)
      if (newLockedCount > lockedCharsRef.current) {
        const extra = Math.min(newLockedCount - lockedCharsRef.current, 3)
        for (let k = 0; k < extra; k++) {
          setTimeout(() => playTick(0.95), k * 60)
        }
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
      <motion.div
        key="ready-state"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`relative p-14 sm:p-20 rounded-[3rem] shadow-2xl text-center overflow-hidden border-2 transition-all ${
          isFinale
            ? 'bg-gradient-to-b from-[#1F140A] via-[#120B05] to-[#080503] border-amber-500/60 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_80px_rgba(245,158,11,0.25)]'
            : 'bg-gradient-to-b from-[#1C1A17] via-[#11100E] to-[#0A0908] border-amber-500/50 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_60px_rgba(232,60,0,0.25)]'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_65%)] pointer-events-none" />

        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative bg-amber-500/10 border border-amber-500/30 text-amber-400">
          {isFinale ? (
            <>
              <Crown size={80} className="text-amber-400 animate-bounce" />
              <div className="absolute inset-0 rounded-[2rem] border border-amber-400/50 animate-ping opacity-30" />
            </>
          ) : (
            <>
              <Trophy size={76} className="text-amber-400" />
              <div className="absolute inset-0 rounded-[2rem] border border-amber-400/40 animate-ping opacity-25" />
            </>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-black uppercase tracking-widest mb-6 bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <Sparkles size={18} className="text-amber-400 animate-spin" />
          <span>Stage Ready · Awaiting Announcement</span>
        </div>

        <h3 className="text-6xl sm:text-8xl font-black mb-6 text-white tracking-tight">
          {isFinale ? '👑 Grand Finale Verdict Sealed' : 'Round 1 Graded & Verified'}
        </h3>
        <p className="max-w-3xl mx-auto text-2xl sm:text-3xl font-medium text-slate-300">
          {isFinale
            ? 'Waiting for admin to unseal 5th Place. Each place opens only when triggered.'
            : 'Waiting for admin to initiate the Top 20 announcement (#20 ➔ #1).'}
        </p>
      </motion.div>
    )
  }

  // ─── RANK THEME (no green anywhere) ─────────────────────────────────────────
  const trackConfig = currentSpotlightTeam?.track ? getTrackConfig(currentSpotlightTeam.track) : null
  const isChampion = activeRank === 1

  const rankTheme = isChampion
    ? {
        badge: 'bg-[#E83C00] text-white ring-4 ring-amber-400/60',
        rankText:
          'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 drop-shadow-[0_0_60px_rgba(251,191,36,0.9)]',
        cardBorder: 'border-[#E83C00] ring-4 ring-amber-400/70',
        cardBg: 'bg-gradient-to-b from-[#2E1205] via-[#1A0A02] to-[#0D0501]',
        glow: 'bg-gradient-to-r from-amber-500/50 via-[#E83C00]/60 to-amber-500/50',
        scoreTxt: 'text-amber-300',
        nameColor: 'text-amber-100',
        cardShadow: 'shadow-[0_0_100px_rgba(232,60,0,0.6)]',
      }
    : activeRank === 2
    ? {
        badge: 'bg-slate-600 text-white border border-slate-400',
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
        badge: 'bg-amber-800 text-white border border-amber-600',
        rankText: 'text-amber-300 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]',
        cardBorder: 'border-amber-700/60',
        cardBg: 'bg-gradient-to-b from-[#1F1508] via-[#110D05] to-[#080601]',
        glow: 'bg-gradient-to-r from-amber-700/30 via-amber-400/25 to-amber-700/30',
        scoreTxt: 'text-amber-300',
        nameColor: 'text-amber-100',
        cardShadow: 'shadow-[0_30px_80px_rgba(0,0,0,0.9)]',
      }
    : {
        // Ranks 4–20: deep obsidian + warm orange — NO green
        badge: 'bg-orange-900/80 text-orange-200 border border-orange-600/60',
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
        key={`spotlight-card-${activeRank}-${isDecrypting ? 'spinning' : 'locked'}`}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{
          opacity: 1,
          scale: justLocked ? [1, 1.03, 1] : 1,
          y: 0,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
          <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[20%]">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg max-w-full ${
                isDecrypting
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse ring-2 ring-amber-400/30'
                  : rankTheme.badge
              }`}
            >
              {isDecrypting ? (
                <Sparkles size={12} className="text-amber-300 animate-spin shrink-0" />
              ) : isChampion ? (
                <Crown size={12} className="text-amber-200 fill-amber-200 animate-bounce shrink-0" />
              ) : activeRank === 2 ? (
                <Medal size={12} className="text-slate-200 shrink-0" />
              ) : activeRank === 3 ? (
                <Award size={12} className="text-amber-200 shrink-0" />
              ) : (
                <ShieldCheck size={12} className="text-orange-200 shrink-0" />
              )}
              <span className="truncate">
                {isDecrypting
                  ? `#${activeRank} DECRYPTING`
                  : isChampion
                  ? (isFinale ? '👑 1st Place' : '👑 #1 Seed')
                  : activeRank === 2
                  ? (isFinale ? '🥈 2nd Place' : '#2 Seed')
                  : activeRank === 3
                  ? (isFinale ? '🥉 3rd Place' : '#3 Seed')
                  : 'Qualified'}
              </span>
            </div>

            {/* Rank Number — sized to fit column */}
            <div
              className={`font-black tracking-tighter leading-none text-[4rem] xl:text-[5.5rem] ${
                isDecrypting
                  ? 'text-amber-400/90 font-mono animate-pulse'
                  : rankTheme.rankText
              }`}
            >
              {isFinale && activeRank === 1 ? '👑' : `#${activeRank}`}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="w-px self-stretch bg-white/10 shrink-0" />

          {/* ── CENTER: Team Name + College/Track ── */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center overflow-hidden px-6 min-h-[160px]">
            {isDecrypting ? (
              <>
                {/* Cipher: nowrap keeps it on 1 line, text scales to fit */}
                <span className="font-mono text-3xl xl:text-5xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.9)] select-none whitespace-nowrap overflow-hidden max-w-full">
                  {scrambleDisplay || 'IDENTIFYING...'}
                </span>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-amber-300/80 text-xs sm:text-sm font-mono tracking-wider">
                  <Lock size={12} className="text-amber-400 animate-spin shrink-0" />
                  <span>⚡ DECRYPTING VERIFIED SUBMISSION MARKS ⚡</span>
                </div>
              </>
            ) : (
              <>
                <motion.h2
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.65 }}
                  className="font-mono text-4xl xl:text-6xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.85)] leading-tight w-full"
                  style={{ wordBreak: 'break-word' }}
                >
                  {(currentSpotlightTeam?.teamName || targetName).toUpperCase()}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.35 }}
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
              </>
            )}
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
