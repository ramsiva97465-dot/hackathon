import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Crown, Lock, ShieldCheck, Sparkles } from 'lucide-react'

export type GrandFinaleEntry = {
  teamId: string
  teamName: string
  college?: string
  track?: string
  totalScore: number
  rank: number
}

type Props = {
  finalists: GrandFinaleEntry[]
  revealStep: number
  isAnimating: boolean
  stepStartedAt: number
  stepDurationMs: number
}

const PLACE_LABELS: Record<number, string> = {
  1: 'Grand Champion',
  2: '2nd Place',
  3: '3rd Place',
  4: '4th Place',
  5: '5th Place',
}

const CIPHER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#%&?'

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function placeShortLabel(rank: number) {
  if (rank === 1) return 'Champion'
  if (rank === 2) return '2nd Place'
  if (rank === 3) return '3rd Place'
  return `${rank}th Place`
}

function PlaceProgress({
  finalists,
  completedSteps,
  activeRank,
}: {
  finalists: GrandFinaleEntry[]
  completedSteps: number
  activeRank: number
}) {
  return (
    <div className="grid w-full grid-cols-5 gap-2">
      {[5, 4, 3, 2, 1].map((rank, index) => {
        const entry = finalists.find((team) => team.rank === rank)
        const unlocked = completedSteps >= index + 1
        const active = rank === activeRank && !unlocked
        return (
          <motion.div
            key={rank}
            layout
            className={`min-w-0 rounded-2xl border px-2 py-2.5 text-center transition-colors sm:px-3 ${
              unlocked
                ? 'border-amber-400/35 bg-amber-400/10'
                : active
                ? 'border-amber-300/50 bg-amber-300/10'
                : 'border-white/10 bg-black/20'
            }`}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5">
              {unlocked ? (
                <CheckCircle2 size={11} className="text-amber-300" />
              ) : (
                <Lock size={10} className={active ? 'text-amber-300' : 'text-white/25'} />
              )}
              <span className={`font-mono text-[9px] font-black uppercase tracking-widest ${
                unlocked || active ? 'text-amber-200' : 'text-white/30'
              }`}>
                {placeShortLabel(rank)}
              </span>
            </div>
            <p className={`truncate text-[10px] font-bold sm:text-xs ${
              unlocked ? 'text-white' : 'text-white/25'
            }`}>
              {unlocked ? (entry?.teamName || 'Result unavailable') : 'Identity sealed'}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}

function PlaceReveal({
  entry,
  rank,
  progress,
  isAnimating,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
}) {
  const identityVisible = !isAnimating || progress >= 0.64
  const scoreProgress = !isAnimating ? 1 : clamp((progress - 0.68) / 0.32)
  const easedScoreProgress = 1 - Math.pow(1 - scoreProgress, 3)
  const score = Number(entry?.totalScore || 0) * easedScoreProgress
  const cipher = useMemo(() => {
    const length = Math.max(10, Math.min(22, entry?.teamName?.length || 12))
    return Array.from({ length }, (_, index) => CIPHER[(index * 7 + rank * 3) % CIPHER.length]).join('')
  }, [entry?.teamName, rank])
  const sweepFromLeft = rank % 2 === 1

  return (
    <motion.div
      key={`place-${rank}`}
      initial={{ opacity: 0, scale: 0.975 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative flex min-h-[390px] w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-amber-400/40 bg-gradient-to-b from-[#1D1207] via-[#0C0804] to-[#050302] px-6 py-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.75),0_0_55px_rgba(245,158,11,0.12)] sm:px-12"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.13),transparent_52%)]" />
      {isAnimating && (
        <motion.div
          aria-hidden
          initial={{ x: sweepFromLeft ? '-120%' : '220%' }}
          animate={{ x: sweepFromLeft ? '220%' : '-120%' }}
          transition={{ duration: rank === 4 ? 2.8 : 2.2, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-y-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent"
        />
      )}

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-black/45 px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
          {identityVisible ? <ShieldCheck size={12} /> : <Lock size={12} />}
          {identityVisible ? `${PLACE_LABELS[rank]} revealed` : `Unsealing ${PLACE_LABELS[rank]}`}
        </div>

        <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300/75">
          {PLACE_LABELS[rank]}
        </p>
        <motion.div
          className="my-5 flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/30 bg-black/45 shadow-[inset_0_0_25px_rgba(245,158,11,0.08)]"
          animate={isAnimating && !identityVisible
            ? { scale: [0.96, 1.035, 0.96], borderColor: ['rgba(251,191,36,.2)', 'rgba(251,191,36,.6)', 'rgba(251,191,36,.2)'] }
            : { scale: 1 }}
          transition={{ duration: 1.8, repeat: isAnimating && !identityVisible ? Infinity : 0 }}
        >
          {identityVisible ? (
            <CheckCircle2 size={38} className="text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]" />
          ) : (
            <Lock size={34} className="text-amber-300/80" />
          )}
        </motion.div>

        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
          {identityVisible ? 'Official finalist' : 'Identity sealed'}
        </p>
        <h2 className={`min-h-[52px] max-w-full truncate font-mono text-3xl font-black tracking-[0.09em] sm:text-5xl ${
          identityVisible
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300'
            : 'text-amber-200/55'
        }`}>
          {identityVisible ? (entry?.teamName || 'RESULT UNAVAILABLE') : cipher}
        </h2>

        <div className="mt-5 min-h-[84px]">
          {identityVisible ? (
            <>
              <motion.p
                className="font-mono text-4xl font-black tabular-nums text-amber-200 sm:text-6xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {score.toFixed(1)}
              </motion.p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Final score</p>
            </>
          ) : (
            <p className="pt-4 font-mono text-3xl font-black tracking-widest text-white/20">— — . —</p>
          )}
        </div>

        {!isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300"
          >
            <CheckCircle2 size={14} />
            {PLACE_LABELS[rank]} revealed
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function VerdictInterruption({ phase }: { phase: 'accessing' | 'denied' | 'wait' }) {
  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[430px] w-full flex-col items-center justify-center rounded-[2.5rem] border border-amber-400/20 bg-[#050403] px-6 text-center shadow-[0_35px_100px_rgba(0,0,0,0.9)]"
    >
      <Lock size={30} className={phase === 'denied' ? 'text-orange-400' : 'text-amber-300'} />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.34em] text-amber-300/70">Final Vault</p>
      {phase === 'accessing' && (
        <>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl">Accessing final verdict...</h2>
          <div className="mt-8 h-1.5 w-full max-w-lg overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-amber-600 to-amber-200"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 0.99 }}
              transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-3 font-mono text-lg font-black text-amber-200">99%</p>
        </>
      )}
      {phase === 'denied' && (
        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="mt-5 text-4xl font-black uppercase tracking-[0.16em] text-orange-400 sm:text-6xl"
        >
          Access Denied
        </motion.h2>
      )}
      {phase === 'wait' && (
        <>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-5xl font-black text-white sm:text-7xl">
            WAIT.
          </motion.h2>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.24em] text-amber-200 sm:text-xl">
            The final verdict is being verified.
          </p>
        </>
      )}
    </motion.div>
  )
}

function FinalTwo() {
  return (
    <motion.div
      key="final-two"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[460px] w-full flex-col items-center justify-center rounded-[2.5rem] border border-amber-400/30 bg-gradient-to-b from-[#170F07] to-[#050302] px-6 py-8 text-center shadow-[0_35px_100px_rgba(0,0,0,0.85)]"
    >
      <p className="text-xs font-black uppercase tracking-[0.34em] text-amber-300/75">Grand Finale</p>
      <h2 className="mt-2 text-4xl font-black text-white sm:text-6xl">THE FINAL TWO</h2>
      <p className="mt-2 text-sm text-white/55 sm:text-lg">Two finalists remain. Only one will be crowned.</p>
      <div className="mt-8 grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
        {[0, 1].map((slot) => (
          <motion.div
            key={slot}
            animate={{ boxShadow: ['0 0 20px rgba(245,158,11,.08)', '0 0 45px rgba(245,158,11,.2)', '0 0 20px rgba(245,158,11,.08)'] }}
            transition={{ duration: 3, repeat: Infinity, delay: slot * 0.55 }}
            className="flex min-h-[190px] flex-col items-center justify-center rounded-[2rem] border border-amber-400/30 bg-black/35"
          >
            <Lock size={34} className="text-amber-300/80" />
            <span className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-amber-200">Finalist</span>
            <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/30">Identity sealed</span>
          </motion.div>
        ))}
        <span className="text-xl font-black italic text-amber-300 sm:text-3xl">VS</span>
      </div>
      <p className="mt-7 text-xs font-black uppercase tracking-[0.34em] text-amber-200">One will be crowned.</p>
    </motion.div>
  )
}

function ChampionSequence({
  entry,
  elapsed,
  finished,
}: {
  entry?: GrandFinaleEntry
  elapsed: number
  finished: boolean
}) {
  const stage = finished || elapsed >= 11_000
    ? 'winner'
    : elapsed < 5_000
    ? 'countdown'
    : elapsed < 5_700
    ? 'freeze'
    : elapsed < 7_000
    ? 'blackout'
    : elapsed < 8_200
    ? 'light'
    : elapsed < 10_200
    ? 'crown'
    : 'flash'
  const count = Math.max(1, 5 - Math.floor(elapsed / 1_000))
  const winnerScoreProgress = finished ? 1 : clamp((elapsed - 11_000) / 1_000)
  const winnerScore = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - winnerScoreProgress, 3))

  return (
    <div className="relative min-h-[500px] w-full overflow-hidden rounded-[2.5rem] border border-amber-400/25 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.95)]">
      <AnimatePresence mode="wait">
        {(stage === 'countdown' || stage === 'freeze') && (
          <motion.div
            key={`count-${stage}-${count}`}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: stage === 'freeze' ? 1.08 : 1 }}
            exit={{ opacity: 0, scale: 1.24 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.34em] text-amber-200/75 sm:text-base">
              The champion will be revealed in
            </p>
            <span className="mt-5 font-mono text-8xl font-black tabular-nums text-amber-200 drop-shadow-[0_0_32px_rgba(251,191,36,0.55)] sm:text-[11rem]">
              {String(count).padStart(2, '0')}
            </span>
          </motion.div>
        )}

        {stage === 'light' && (
          <motion.div key="light" className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 1.8], opacity: [0, 1, 0.75] }}
              transition={{ duration: 1.1 }}
              className="h-3 w-3 rounded-full bg-amber-100 shadow-[0_0_20px_8px_rgba(251,191,36,.8),0_0_90px_35px_rgba(245,158,11,.3)]"
            />
          </motion.div>
        )}

        {stage === 'crown' && (
          <motion.div key="crown" initial={{ opacity: 0, scale: 0.65 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center">
            <Crown size={110} strokeWidth={1.2} className="text-amber-300/80 fill-amber-500/10 drop-shadow-[0_0_35px_rgba(251,191,36,.45)]" />
          </motion.div>
        )}

        {stage === 'flash' && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.15] }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-amber-100" />
        )}

        {stage === 'winner' && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_46%,rgba(245,158,11,.25),transparent_52%)] px-6 text-center"
          >
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity }}>
              <Crown size={76} className="fill-amber-400/25 text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,.65)]" />
            </motion.div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.38em] text-amber-300">Grand Champion</p>
            <h2 className="mt-3 max-w-full truncate text-4xl font-black text-white sm:text-7xl">
              {entry?.teamName || 'RESULT UNAVAILABLE'}
            </h2>
            <p className="mt-3 font-mono text-4xl font-black tabular-nums text-amber-200 sm:text-6xl">{winnerScore.toFixed(1)}</p>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-white/55 sm:text-sm">Voice for Tamil Nadu 2026</p>
            <Sparkles size={22} className="absolute left-[18%] top-[28%] text-amber-300/70" />
            <Sparkles size={18} className="absolute right-[20%] top-[35%] text-orange-300/65" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GrandFinaleExperience({
  finalists,
  revealStep,
  isAnimating,
  stepStartedAt,
  stepDurationMs,
}: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const shouldTick = isAnimating || revealStep === 4
    if (!shouldTick) return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [isAnimating, revealStep, stepStartedAt])

  const elapsed = Math.max(0, now - (stepStartedAt || now))
  const duration = Math.max(1, stepDurationMs)
  const progress = isAnimating ? clamp(elapsed / duration) : 1
  const activeRank = Math.max(1, 6 - revealStep)
  const activeEntry = finalists.find((entry) => entry.rank === activeRank)
  const completedSteps = revealStep === 5
    ? (isAnimating ? 4 : 5)
    : Math.max(0, revealStep - (isAnimating ? 1 : 0))
  const isVerdictSequence = revealStep === 4 && !isAnimating && elapsed - duration >= 1_200

  let scene: ReactNode
  if (revealStep === 5) {
    scene = <ChampionSequence entry={activeEntry} elapsed={elapsed} finished={!isAnimating} />
  } else if (revealStep === 4 && !isAnimating) {
    const postRevealElapsed = Math.max(0, elapsed - duration)
    scene = postRevealElapsed < 1_200
      ? <PlaceReveal entry={activeEntry} rank={activeRank} progress={1} isAnimating={false} />
      : postRevealElapsed < 2_700
      ? <VerdictInterruption phase="accessing" />
      : postRevealElapsed < 4_200
      ? <VerdictInterruption phase="denied" />
      : postRevealElapsed < 6_200
      ? <VerdictInterruption phase="wait" />
      : <FinalTwo />
  } else {
    scene = <PlaceReveal entry={activeEntry} rank={activeRank} progress={progress} isAnimating={isAnimating} />
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <AnimatePresence mode="wait">{scene}</AnimatePresence>
      {revealStep < 5 && !isVerdictSequence && (
        <div className="w-full rounded-[1.5rem] border border-amber-400/20 bg-[#0A0704] p-3 shadow-xl">
          <PlaceProgress finalists={finalists} completedSteps={completedSteps} activeRank={activeRank} />
        </div>
      )}
    </div>
  )
}
