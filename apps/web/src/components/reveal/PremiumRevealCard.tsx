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

  useEffect(() => {
    if (!isDecrypting) {
      if (prevDecrypting.current) {
        setJustLocked(true)
        triggerQualifierConfetti(activeRank)
        const t = setTimeout(() => setJustLocked(false), 1400)
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

      const fakeScore = (Math.random() * 80 + 15).toFixed(1)
      setRollingScore(fakeScore)
    }, 45)

    return () => clearInterval(interval)
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
        className={`absolute -inset-2 rounded-[3.2rem] blur-3xl pointer-events-none transition-opacity duration-700 ${
          isDecrypting
            ? `opacity-90 ${rankTheme.glow} animate-pulse`
            : `opacity-60 ${rankTheme.glow}`
        }`}
      />

      <motion.div
        key={`spotlight-card-${activeRank}-${isDecrypting ? 'spinning' : 'locked'}`}
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{
          opacity: 1,
          scale: justLocked ? [1, 1.04, 1] : 1,
          y: 0,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative p-12 sm:p-16 xl:p-20 rounded-[2.8rem] overflow-hidden text-center border-2 transition-all
          ${rankTheme.cardBg}
          ${isDecrypting ? 'border-amber-500/80 shadow-[0_0_100px_rgba(245,158,11,0.45)]' : `${rankTheme.cardBorder} ${rankTheme.cardShadow}`}
        `}
      >
        {/* Subtle dot-grid texture for depth */}
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

        {/* ── 1. Ceremony Badge ── */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-base sm:text-lg font-black uppercase tracking-widest shadow-lg ${
              isDecrypting
                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse ring-2 ring-amber-400/30'
                : rankTheme.badge
            }`}
          >
            {isDecrypting ? (
              <>
                <Sparkles size={20} className="text-amber-300 animate-spin" />
                <span>
                  {isFinale
                    ? `⚡ DECRYPTING ${activeRank === 1 ? 'GRAND CHAMPION' : `PLACE #${activeRank}`} ⚡`
                    : `⚡ UNSEALING QUALIFIER #${activeRank} ⚡`}
                </span>
              </>
            ) : isChampion ? (
              <>
                <Crown size={20} className="text-amber-200 fill-amber-200 animate-bounce" />
                <span>{isFinale ? '👑 Grand Champion · 1st Place' : '👑 #1 Seed Qualifier'}</span>
              </>
            ) : activeRank === 2 ? (
              <>
                <Medal size={20} className="text-slate-200" />
                <span>{isFinale ? '🥈 1st Runner Up · 2nd Place' : '#2 Seed Qualifier'}</span>
              </>
            ) : activeRank === 3 ? (
              <>
                <Award size={20} className="text-amber-200" />
                <span>{isFinale ? '🥉 2nd Runner Up · 3rd Place' : '#3 Seed Qualifier'}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} className="text-orange-200" />
                <span>Qualified for Round 2</span>
              </>
            )}
          </div>
        </div>

        {/* ── 2. GIANT Rank Number ── LED-scale */}
        <div
          className={`font-black mb-6 tracking-tighter transition-colors leading-none ${
            isDecrypting
              ? 'text-amber-400/90 font-mono animate-pulse text-8xl sm:text-[9rem] xl:text-[11rem]'
              : `${rankTheme.rankText} text-8xl sm:text-[9rem] xl:text-[11rem]`
          }`}
        >
          {isFinale && activeRank === 1 ? '👑 #1' : `#${activeRank}`}
        </div>

        {/* ── 3. Team Name — Cipher Scramble or Revealed ── */}
        <div className="min-h-[9rem] sm:min-h-[11rem] xl:min-h-[13rem] flex items-center justify-center mb-8 px-4">
          {isDecrypting ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <span className="font-mono text-5xl sm:text-7xl xl:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_0_60px_rgba(245,158,11,1)] select-none break-all leading-tight">
                {scrambleDisplay || 'IDENTIFYING...'}
              </span>
              <span className="text-base sm:text-lg font-mono font-bold uppercase tracking-[0.35em] text-amber-300/80 animate-pulse">
                ⚡ DECRYPTING VERIFIED SUBMISSION MARKS ⚡
              </span>
            </div>
          ) : (
            <motion.h2
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.45, duration: 0.7 }}
              className={`text-5xl sm:text-7xl xl:text-8xl font-black tracking-tight drop-shadow-lg leading-tight ${rankTheme.nameColor}`}
              style={{ wordBreak: 'break-word' }}
            >
              {currentSpotlightTeam?.teamName || targetName}
            </motion.h2>
          )}
        </div>

        {/* ── 4. College & Track ── */}
        <div className="min-h-[4rem] flex items-center justify-center mb-10">
          {isDecrypting ? (
            <div className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-amber-300/80 text-lg sm:text-xl font-mono tracking-wider shadow-inner">
              <Lock size={18} className="text-amber-400 animate-spin" />
              <span>COLLEGE & TRACK ENCRYPTED</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="flex items-center justify-center gap-4 flex-wrap text-2xl sm:text-3xl font-medium text-slate-300"
            >
              <span className="font-bold text-white/90">
                {currentSpotlightTeam?.college || 'Tamil Nadu'}
              </span>
              {trackConfig && (
                <>
                  <span className="opacity-40 text-4xl leading-none">·</span>
                  <span
                    className="px-6 py-2.5 rounded-xl text-lg sm:text-xl font-black uppercase tracking-wider border shadow-sm"
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

        {/* ── 5. Score Pill ── LED-scale */}
        <div className="inline-flex items-center gap-8 px-12 py-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 shadow-inner">
          <span className="text-base sm:text-lg font-bold uppercase tracking-widest text-amber-300/90 font-mono">
            {isDecrypting ? 'CALCULATING SCORE' : isFinale ? 'FINAL SCORE' : 'ROUND 1 SCORE'}
          </span>
          <span
            className={`text-6xl sm:text-7xl xl:text-8xl font-black font-mono tracking-wider ${
              isDecrypting ? 'text-amber-300/80 animate-pulse' : rankTheme.scoreTxt
            }`}
          >
            {isDecrypting ? rollingScore : Number(currentSpotlightTeam?.totalScore || 0).toFixed(1)}
          </span>
        </div>

        {/* ── 6. Progress Footnote ── */}
        <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-base sm:text-lg font-semibold px-4 text-slate-400">
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
