import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Crown, Medal, Award, ShieldCheck, Lock, Sparkles, Trophy } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'

const CIPHER_GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!#%*&?'

function randomChar() {
  return CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)]
}

export function triggerQualifierConfetti(rank: number) {
  try {
    if (rank === 1) {
      // Grand Champion dual cannon
      const end = Date.now() + 3000
      const colors = ['#E83C00', '#F59E0B', '#FFD700', '#FBBF24', '#FFFFFF', '#10B981']
      ;(function frame() {
        confetti({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0, y: 0.75 }, colors })
        confetti({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1, y: 0.75 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    } else if (rank <= 3) {
      // Podium burst
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff', '#E83C00', '#38bdf8'],
      })
    } else {
      // Top 20 qualifier crisp burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10B981', '#34D399', '#FBBF24', '#FFFFFF'],
      })
    }
  } catch (e) {
    // Non-blocking fallback
  }
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
  const activeRank = (isDecrypting && decryptingRank != null) ? decryptingRank : currentSpotlightRank
  const targetName = (revealingTeamName || currentSpotlightTeam?.teamName || '').toUpperCase()

  // High-velocity scramble state
  const [scrambleDisplay, setScrambleDisplay] = useState('')
  const [rollingScore, setRollingScore] = useState('00.0')
  const [justLocked, setJustLocked] = useState(false)
  const prevDecrypting = useRef(isDecrypting)

  // Scramble and odometer timer
  useEffect(() => {
    if (!isDecrypting) {
      if (prevDecrypting.current) {
        // Just finished decrypting! Trigger punch impact
        setJustLocked(true)
        triggerQualifierConfetti(activeRank)
        const t = setTimeout(() => setJustLocked(false), 1200)
        return () => clearTimeout(t)
      }
      prevDecrypting.current = false
      return
    }

    prevDecrypting.current = true
    const startTime = Date.now()
    const targetLen = Math.max(8, targetName.length || 10)

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / nameSpinMs)

      // Character scramble: resolve from left to right during the last 30% of time
      const lockThreshold = 0.65
      let chars = ''
      for (let i = 0; i < targetLen; i++) {
        const charProgress = (progress - lockThreshold) / (1 - lockThreshold)
        const charLockIdx = Math.floor(charProgress * targetLen)
        if (progress >= lockThreshold && i <= charLockIdx && targetName[i]) {
          chars += targetName[i]
        } else if (targetName[i] === ' ') {
          chars += ' '
        } else {
          chars += randomChar()
        }
      }
      setScrambleDisplay(chars)

      // Score odometer rolling
      const fakeScore = (Math.random() * 80 + 15).toFixed(1)
      setRollingScore(fakeScore)
    }, 45)

    return () => clearInterval(interval)
  }, [isDecrypting, targetName, nameSpinMs, activeRank])

  // Ready state: before any team is announced
  if (revealedStep === 0 && !isDecrypting) {
    return (
      <motion.div
        key="ready-state"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`relative p-8 sm:p-12 rounded-[2.5rem] shadow-2xl text-center overflow-hidden border-2 transition-all ${
          isFinale
            ? 'bg-gradient-to-b from-[#1F140A] via-[#120B05] to-[#080503] border-amber-500/50 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(245,158,11,0.2)]'
            : 'bg-gradient-to-b from-[#1C1A17] via-[#11100E] to-[#0A0908] border-amber-500/40 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(232,60,0,0.2)]'
        }`}
      >
        {/* Ambient backlighting aura */}
        <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner relative bg-amber-500/10 border border-amber-500/30 text-amber-400">
          {isFinale ? (
            <>
              <Crown size={42} className="text-amber-400 animate-bounce" />
              <div className="absolute inset-0 rounded-3xl border border-amber-400/50 animate-ping opacity-30" />
            </>
          ) : (
            <>
              <Trophy size={40} className="text-amber-400" />
              <div className="absolute inset-0 rounded-3xl border border-amber-400/40 animate-ping opacity-25" />
            </>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3 bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <Sparkles size={13} className="text-amber-400 animate-spin" />
          <span>Stage Ready • Awaiting Announcement</span>
        </div>

        <h3 className="text-3xl sm:text-4xl font-black mb-3 text-white tracking-tight">
          {isFinale ? '👑 Grand Finale Verdict Sealed' : 'Round 1 Graded & Verified'}
        </h3>
        <p className="max-w-lg mx-auto text-sm sm:text-base font-medium text-slate-300">
          {isFinale
            ? 'Waiting for the admin to unseal 5th Place. Each place opens only when triggered from the remote console.'
            : 'Waiting for the admin to initiate the Top 20 announcement (#20 ➔ #1) from the rounds console.'}
        </p>
      </motion.div>
    )
  }

  // Active or Decrypting Spotlight Card
  const trackConfig = currentSpotlightTeam?.track ? getTrackConfig(currentSpotlightTeam.track) : null
  const isChampion = activeRank === 1

  return (
    <div className="relative w-full">
      {/* Dynamic Ambient Backlight Glow */}
      <div
        className={`absolute -inset-1.5 rounded-[2.8rem] blur-2xl pointer-events-none transition-opacity duration-700 ${
          isDecrypting
            ? 'opacity-80 bg-gradient-to-r from-amber-500/40 via-[#E83C00]/50 to-amber-500/40 animate-pulse'
            : isChampion
            ? 'opacity-90 bg-gradient-to-r from-amber-500/40 via-yellow-400/50 to-[#E83C00]/50'
            : 'opacity-50 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20'
        }`}
      />

      <motion.div
        key={`spotlight-card-${activeRank}-${isDecrypting ? 'spinning' : 'locked'}`}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{
          opacity: 1,
          scale: justLocked ? [1, 1.03, 1] : 1,
          y: 0,
        }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`relative p-8 sm:p-12 rounded-[2.5rem] overflow-hidden text-center border-2 shadow-2xl transition-all ${
          isFinale && activeRank === 1
            ? 'bg-gradient-to-b from-[#2E1205] via-[#1A0A02] to-[#0D0501] border-[#E83C00] text-white ring-4 ring-amber-400/80 shadow-[0_0_80px_rgba(232,60,0,0.6)]'
            : isDecrypting
            ? 'bg-gradient-to-b from-[#1C1610] via-[#100C09] to-[#080605] border-amber-500/70 text-white shadow-[0_0_60px_rgba(245,158,11,0.35)]'
            : 'bg-gradient-to-b from-[#181614] via-[#100F0D] to-[#090807] border-amber-500/40 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Animated Laser Scanning Beam when Decrypting */}
        {isDecrypting && (
          <motion.div
            aria-hidden
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent mix-blend-screen"
          />
        )}

        {/* 1. Header Rank / Ceremony Badge */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
              isDecrypting
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse ring-2 ring-amber-400/30'
                : isChampion
                ? 'bg-[#E83C00] text-white ring-4 ring-amber-400/60 font-black'
                : activeRank === 2
                ? 'bg-slate-700 text-white border border-slate-500'
                : activeRank === 3
                ? 'bg-amber-800 text-white border border-amber-600'
                : 'bg-emerald-600 text-white border border-emerald-400'
            }`}
          >
            {isDecrypting ? (
              <>
                <Sparkles size={14} className="text-amber-300 animate-spin" />
                <span>
                  {isFinale
                    ? `⚡ DECRYPTING ${activeRank === 1 ? 'GRAND CHAMPION' : `PLACE #${activeRank}`} ⚡`
                    : `⚡ UNSEALING QUALIFIER #${activeRank} ⚡`}
                </span>
              </>
            ) : isChampion ? (
              <>
                <Crown size={15} className="text-amber-200 fill-amber-200 animate-bounce" />
                <span>{isFinale ? '👑 Grand Champion · 1st Place' : '👑 #1 Seed Qualifier'}</span>
              </>
            ) : activeRank === 2 ? (
              <>
                <Medal size={15} className="text-slate-200" />
                <span>{isFinale ? '🥈 1st Runner Up · 2nd Place' : '#2 Seed Qualifier'}</span>
              </>
            ) : activeRank === 3 ? (
              <>
                <Award size={15} className="text-amber-200" />
                <span>{isFinale ? '🥉 2nd Runner Up · 3rd Place' : '#3 Seed Qualifier'}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} className="text-emerald-200" />
                <span>Qualified for Round 2</span>
              </>
            )}
          </div>
        </div>

        {/* 2. Giant Rank Header */}
        <div
          className={`text-5xl sm:text-7xl font-black mb-4 tracking-tighter transition-colors ${
            isDecrypting
              ? 'text-amber-400/90 font-mono animate-pulse'
              : isChampion
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]'
              : activeRank === 2
              ? 'text-slate-200 drop-shadow-[0_0_20px_rgba(203,213,225,0.4)]'
              : activeRank === 3
              ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              : 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]'
          }`}
        >
          {isFinale && activeRank === 1 ? '👑 GRAND CHAMPION' : `#${activeRank}`}
        </div>

        {/* 3. Team Name: High-Velocity Glowing Cipher vs Locked Name */}
        <div className="min-h-[5.5rem] sm:min-h-[6.5rem] flex items-center justify-center mb-4 px-2">
          {isDecrypting ? (
            <div className="flex flex-col items-center gap-1.5 w-full">
              <span className="font-mono text-3xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)] select-none">
                {scrambleDisplay || 'IDENTIFYING WINNER...'}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.3em] text-amber-300/80 animate-pulse mt-1">
                ⚡ DECRYPTING VERIFIED SUBMISSION MARKS ⚡
              </span>
            </div>
          ) : (
            <motion.h2
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-md truncate max-w-full px-2 ${
                isChampion ? 'text-amber-100' : 'text-white'
              }`}
            >
              {currentSpotlightTeam?.teamName || targetName}
            </motion.h2>
          )}
        </div>

        {/* 4. College & Track (Concealed during Decryption!) */}
        <div className="min-h-[2.5rem] flex items-center justify-center mb-6">
          {isDecrypting ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-300/80 text-xs sm:text-sm font-mono tracking-wider shadow-inner">
              <Lock size={13} className="text-amber-400 animate-spin" />
              <span>COLLEGE & TRACK ENCRYPTED</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center justify-center gap-3 flex-wrap text-sm sm:text-base font-medium text-slate-300"
            >
              <span className="font-bold text-white/90">
                {currentSpotlightTeam?.college || 'Tamil Nadu'}
              </span>
              {trackConfig && (
                <>
                  <span className="opacity-40">•</span>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm"
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

        {/* 5. Score Pill (Odometer while Decrypting, Locked on Reveal) */}
        <div className="inline-flex items-center gap-4 px-8 py-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300/90 font-mono">
            {isDecrypting ? 'CALCULATING SCORE' : isFinale ? 'FINAL SCORE' : 'ROUND 1 SCORE'}
          </span>
          <span
            className={`text-3xl sm:text-4xl font-black font-mono tracking-wider ${
              isDecrypting ? 'text-amber-300/80 animate-pulse' : isChampion ? 'text-amber-300' : 'text-white'
            }`}
          >
            {isDecrypting ? rollingScore : Number(currentSpotlightTeam?.totalScore || 0).toFixed(1)}
          </span>
        </div>

        {/* 6. Bottom Progress Footnote */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold px-2 text-slate-400">
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
