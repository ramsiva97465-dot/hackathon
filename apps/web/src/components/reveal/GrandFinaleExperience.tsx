import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Lock, Sparkles } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'

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

const CIPHER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PODIUM_SRC = '/images/finale-podium-transparent.png'
const DUST = [
  ['6%', '78%', 0], ['12%', '62%', 0.6], ['19%', '84%', 1.1], ['28%', '70%', 0.3],
  ['38%', '88%', 1.7], ['47%', '66%', 0.9], ['58%', '82%', 0.2], ['67%', '71%', 1.4],
  ['76%', '86%', 0.5], ['84%', '64%', 1.8], ['91%', '79%', 0.8], ['94%', '58%', 1.3],
] as const

function GoldOrnament({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/70 sm:w-16" />
      <span className="h-1 w-1 rotate-45 bg-amber-300/80" />
      {children}
      <span className="h-1 w-1 rotate-45 bg-amber-300/80" />
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/70 sm:w-16" />
    </div>
  )
}

function CeremonyAtmosphere({ accent = 'rgba(245,158,11,0.22)' }: { accent?: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(251,191,36,0.18),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0" style={{
        background: `conic-gradient(from 210deg at 50% -8%, transparent 0deg, ${accent} 8deg, transparent 16deg, transparent 164deg, ${accent} 172deg, transparent 180deg)`,
        opacity: 0.55,
      }} />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[18%] -translate-x-1/2 bg-gradient-to-b from-amber-200/18 via-amber-500/6 to-transparent blur-2xl"
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-[18%] left-[-20%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-100/14 to-transparent"
        animate={{ x: ['0%', '220%'] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
      />
      {DUST.map(([left, top, delay]) => (
        <motion.span
          key={`${left}-${top}`}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-200/70 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
          style={{ left, top }}
          animate={{ y: [0, -46, -72], opacity: [0, 0.85, 0], scale: [0.6, 1, 0.4] }}
          transition={{ duration: 5.4, repeat: Infinity, delay, ease: 'easeOut' }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(0,0,0,0.62)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </>
  )
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function scramble(seed: number, length: number) {
  return Array.from({ length }, (_, i) => CIPHER[(seed * 11 + i * 7) % CIPHER.length]).join('')
}

function rankTheme(rank: number) {
  if (rank === 2) {
    return {
      rank: 'text-slate-100 drop-shadow-[0_0_28px_rgba(226,232,240,0.35)]',
      score: 'text-slate-100',
      glow: 'rgba(203,213,225,0.16)',
    }
  }
  if (rank === 3) {
    return {
      rank: 'text-orange-200 drop-shadow-[0_0_28px_rgba(232,60,0,0.35)]',
      score: 'text-orange-200',
      glow: 'rgba(245,158,11,0.16)',
    }
  }
  return {
    rank: 'text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,0.4)]',
    score: 'text-amber-200',
    glow: 'rgba(245,158,11,0.18)',
  }
}

function PodiumMark({
  size = 'md',
  glyph,
  pulse = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  glyph: string
  pulse?: boolean
}) {
  const frame = size === 'lg'
    ? 'w-[168px] sm:w-[210px]'
    : size === 'md'
    ? 'w-[118px] sm:w-[148px]'
    : 'w-[72px] sm:w-[88px]'
  const type = size === 'lg'
    ? 'text-4xl sm:text-5xl'
    : size === 'md'
    ? 'text-2xl sm:text-3xl'
    : 'text-lg sm:text-xl'

  return (
    <div className={`relative aspect-[640/583] ${frame}`}>
      <motion.img
        src={PODIUM_SRC}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        animate={pulse ? { filter: ['brightness(0.84)', 'brightness(1.14)', 'brightness(0.84)'] } : undefined}
        transition={pulse ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.span
        className={`absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 font-serif font-black text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] ${type}`}
        animate={pulse ? { opacity: [0.55, 1, 0.55] } : undefined}
        transition={pulse ? { duration: 2.1, repeat: Infinity } : undefined}
      >
        {glyph}
      </motion.span>
    </div>
  )
}

function StageShell({ children, glow }: { children: ReactNode; glow: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden rounded-[2.5rem] border border-amber-400/35 bg-[#070402] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.92),0_0_80px_rgba(245,158,11,0.16)] sm:px-10 sm:py-10"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1A1006] via-[#0C0703] to-[#040201]"
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <CeremonyAtmosphere accent={glow} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

function PersistentPodiums({
  finalists,
  completedSteps,
  activeRank,
}: {
  finalists: GrandFinaleEntry[]
  completedSteps: number
  activeRank: number
}) {
  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/25" />
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.32em] text-amber-300/80">
          5 Champions · One Stage
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/25" />
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {[1, 2, 3, 4, 5].map((rank) => {
          const unlocked = completedSteps >= (6 - rank)
          const active = rank === activeRank && !unlocked
          const entry = finalists.find((team) => team.rank === rank)
          return (
            <div key={rank} className="flex min-w-0 flex-col items-center">
              <span className="mb-0.5 font-mono text-[9px] font-black text-amber-200/80">{rank}</span>
              <PodiumMark
                size="sm"
                pulse={active}
                glyph={unlocked ? String(rank) : rank <= 2 ? '?' : String(rank)}
              />
              <p className={`mt-1 max-w-full truncate text-center text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
                unlocked ? 'text-amber-100' : active ? 'text-amber-300/80' : 'text-white/25'
              }`}>
                {unlocked ? (entry?.teamName || '—') : active ? 'Unsealing' : 'Sealed'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlaceReveal({
  entry,
  rank,
  progress,
  isAnimating,
  completedSteps,
  finalists,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
  completedSteps: number
  finalists: GrandFinaleEntry[]
}) {
  const identityVisible = !isAnimating || progress >= 0.64
  const scoreProgress = !isAnimating ? 1 : clamp((progress - 0.68) / 0.32)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreProgress, 3))
  const cipher = scramble(Math.floor(progress * 48) + rank, Math.max(10, Math.min(16, entry?.teamName?.length || 12)))
  const theme = rankTheme(rank)
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const sweepMs = rank === 4 ? 2.9 : rank === 2 ? 2.1 : 2.4

  return (
    <StageShell glow={theme.glow}>
      <GoldOrnament>
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-300">
          {identityVisible ? `${PLACE_LABELS[rank]} · Confirmed` : `Unsealing ${PLACE_LABELS[rank]}`}
        </p>
      </GoldOrnament>

      <div className="flex min-h-[220px] items-center gap-3 sm:gap-6">
        <div className="flex w-[22%] shrink-0 flex-col items-center pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/80">{PLACE_LABELS[rank]}</p>
          <p className={`mt-2 font-black leading-none tracking-tighter ${theme.rank} text-[4.2rem] sm:text-[5.5rem]`}>
            #{rank}
          </p>
        </div>

        <div className="w-px self-stretch bg-white/10" />

        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <div className="relative">
            {isAnimating && !identityVisible && (
              <motion.div
                aria-hidden
                initial={{ x: '-130%' }}
                animate={{ x: '180%' }}
                transition={{ duration: sweepMs, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute inset-y-4 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent"
              />
            )}
            <PodiumMark
              size="md"
              pulse={!identityVisible}
              glyph={identityVisible ? String(rank) : '?'}
            />
          </div>
          <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">
            {identityVisible ? 'Official finalist' : 'Identity sealed'}
          </p>
          <h2 className={`mt-2 max-w-full truncate font-black tracking-tight ${
            identityVisible
              ? 'bg-gradient-to-b from-white via-amber-50 to-amber-200 bg-clip-text text-3xl text-transparent sm:text-5xl'
              : 'font-mono text-2xl tracking-[0.14em] text-amber-200/50 sm:text-4xl'
          }`}>
            {identityVisible ? (entry?.teamName || 'RESULT UNAVAILABLE') : cipher}
          </h2>
          {identityVisible && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300"
            >
              <span className="font-medium text-white/80">{entry?.college || 'Tamil Nadu'}</span>
              {track && (
                <span
                  className="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ color: track.color, borderColor: `${track.color}55`, backgroundColor: `${track.color}18` }}
                >
                  {track.label}
                </span>
              )}
            </motion.div>
          )}
        </div>

        <div className="w-px self-stretch bg-white/10" />

        <div className="flex w-[22%] shrink-0 flex-col items-center pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/80">
            {identityVisible ? 'Final Score' : 'Calculating'}
          </p>
          <p className={`mt-2 font-mono text-[2.7rem] font-black leading-none tracking-wider sm:text-[4rem] ${
            identityVisible ? theme.score : 'text-amber-300/50'
          }`}>
            {identityVisible ? score.toFixed(1) : '—.—'}
          </p>
        </div>
      </div>

      <PersistentPodiums finalists={finalists} completedSteps={completedSteps} activeRank={rank} />
    </StageShell>
  )
}

function VerdictInterruption({ phase }: { phase: 'accessing' | 'denied' | 'wait' }) {
  return (
    <StageShell glow={phase === 'denied' ? 'rgba(232,60,0,0.18)' : 'rgba(245,158,11,0.14)'}>
      <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
        <GoldOrnament>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-300">Final Vault</p>
        </GoldOrnament>
        {phase === 'accessing' && (
          <>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Accessing Final Verdict</h2>
            <div className="mt-8 h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-[#E83C00] via-amber-400 to-amber-200"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 0.99 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-3 font-mono text-sm font-black tracking-[0.28em] text-amber-200">99%</p>
          </>
        )}
        {phase === 'denied' && (
          <motion.h2
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.18em' }}
            className="text-4xl font-black uppercase text-[#E83C00] sm:text-6xl"
          >
            Access Denied
          </motion.h2>
        )}
        {phase === 'wait' && (
          <>
            <h2 className="text-5xl font-black tracking-tight text-white sm:text-7xl">Wait.</h2>
            <p className="mt-4 max-w-xl text-sm font-medium uppercase tracking-[0.22em] text-amber-200/90 sm:text-base">
              The final verdict is being verified.
            </p>
          </>
        )}
      </div>
    </StageShell>
  )
}

function FinalTwo() {
  return (
    <StageShell glow="rgba(245,158,11,0.16)">
      <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
        <GoldOrnament>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-300">Grand Finale</p>
        </GoldOrnament>
        <h2 className="mt-3 bg-gradient-to-b from-white via-amber-50 to-amber-200 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">The Final Two</h2>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">Two finalists remain. Only one will be crowned.</p>
        <div className="mt-8 grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          {[0, 1].map((slot) => (
            <div key={slot} className="flex flex-col items-center">
              <PodiumMark size="lg" pulse glyph="?" />
              <span className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-amber-200">Finalist</span>
            </div>
          ))}
          <span className="text-2xl font-black italic text-amber-300 sm:text-4xl">VS</span>
        </div>
        <p className="mt-7 font-mono text-[11px] font-black uppercase tracking-[0.34em] text-amber-300/85">
          One will be crowned
        </p>
      </div>
    </StageShell>
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
  const track = entry?.track ? getTrackConfig(entry.track) : null

  return (
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-[2.5rem] border border-amber-400/35 bg-[#040201] shadow-[0_40px_120px_rgba(0,0,0,0.95)]">
      <CeremonyAtmosphere accent="rgba(245,158,11,0.28)" />
      <AnimatePresence mode="wait">
        {(stage === 'countdown' || stage === 'freeze') && (
          <motion.div
            key={`count-${stage}-${count}`}
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: 1, scale: stage === 'freeze' ? 1.06 : 1 }}
            exit={{ opacity: 0, scale: 1.18 }}
            transition={{ duration: 0.32 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-amber-300/80 sm:text-sm">
              The champion will be revealed in
            </p>
            <span className="mt-4 font-black tabular-nums text-amber-200 drop-shadow-[0_0_36px_rgba(251,191,36,0.55)] text-[7.5rem] sm:text-[11rem]">
              {String(count).padStart(2, '0')}
            </span>
          </motion.div>
        )}

        {stage === 'light' && (
          <motion.div key="light" className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 2.2], opacity: [0, 1, 0.7] }}
              transition={{ duration: 1.1 }}
              className="h-3 w-3 rounded-full bg-amber-100 shadow-[0_0_24px_10px_rgba(251,191,36,.75),0_0_90px_40px_rgba(245,158,11,.28)]"
            />
          </motion.div>
        )}

        {stage === 'crown' && (
          <motion.div key="crown" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center">
            <Crown size={120} strokeWidth={1.15} className="fill-amber-400/15 text-amber-200 drop-shadow-[0_0_40px_rgba(251,191,36,.5)]" />
          </motion.div>
        )}

        {stage === 'flash' && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.12] }} transition={{ duration: 0.55 }} className="absolute inset-0 bg-amber-100" />
        )}

        {stage === 'winner' && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_42%,rgba(245,158,11,.22),transparent_54%)] px-6 text-center"
          >
            <Sparkles size={16} className="absolute left-[16%] top-[24%] text-amber-300/70" />
            <Sparkles size={14} className="absolute right-[18%] top-[30%] text-orange-300/65" />
            <PodiumMark size="lg" glyph="1" />
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.38em] text-amber-300">Grand Champion</p>
            <h2 className="mt-2 max-w-full truncate bg-gradient-to-b from-white via-amber-50 to-amber-200 bg-clip-text text-4xl font-black text-transparent sm:text-6xl">
              {entry?.teamName || 'RESULT UNAVAILABLE'}
            </h2>
            <p className="mt-2 font-mono text-4xl font-black tabular-nums text-amber-200 sm:text-5xl">{winnerScore.toFixed(1)}</p>
            {track && (
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/50">{track.label}</span>
            )}
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Voice for Tamil Nadu 2026</p>
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

  let scene: ReactNode
  if (revealStep === 5) {
    scene = <ChampionSequence entry={activeEntry} elapsed={elapsed} finished={!isAnimating} />
  } else if (revealStep === 4 && !isAnimating) {
    const postRevealElapsed = Math.max(0, elapsed - duration)
    scene = postRevealElapsed < 1_200
      ? <PlaceReveal entry={activeEntry} rank={activeRank} progress={1} isAnimating={false} completedSteps={completedSteps} finalists={finalists} />
      : postRevealElapsed < 2_700
      ? <VerdictInterruption phase="accessing" />
      : postRevealElapsed < 4_200
      ? <VerdictInterruption phase="denied" />
      : postRevealElapsed < 6_200
      ? <VerdictInterruption phase="wait" />
      : <FinalTwo />
  } else {
    scene = (
      <PlaceReveal
        entry={activeEntry}
        rank={activeRank}
        progress={progress}
        isAnimating={isAnimating}
        completedSteps={completedSteps}
        finalists={finalists}
      />
    )
  }

  return (
    <div className="flex w-full flex-col items-center">
      <AnimatePresence mode="wait">{scene}</AnimatePresence>
    </div>
  )
}
