import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

const PLACE: Record<number, { kicker: string }> = {
  1: { kicker: 'Grand Champion' },
  2: { kicker: 'Second Place' },
  3: { kicker: 'Third Place' },
  4: { kicker: 'Fourth Place' },
  5: { kicker: 'Fifth Place' },
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const PODIUM = '/images/finale-podium-transparent.png'
const EASE = [0.22, 1, 0.36, 1] as const

function clamp(n: number) {
  return Math.min(1, Math.max(0, n))
}

function scrambleName(target: string, progress: number, tick: number) {
  const name = (target || 'FINALIST').toUpperCase()
  const hold = Math.max(0, name.trimEnd().length - 1)
  let out = ''
  for (let i = 0; i < name.length; i++) {
    if (name[i] === ' ') {
      out += ' '
      continue
    }
    const lockAt = 0.64 + (i / Math.max(name.length, 1)) * 0.24
    if (progress >= 1 || (progress >= lockAt && i !== hold)) out += name[i]
    else out += ALPHA[(tick + i * 5) % ALPHA.length]
  }
  return out
}

function easeOut(t: number, power = 3.4) {
  return 1 - Math.pow(1 - clamp(t), power)
}

/** Edge-on → face-on, with a last-moment settle. */
function wreathYaw(progress: number, live: boolean) {
  if (!live) return 0
  if (progress <= 0.08) return 82
  if (progress < 0.72) return 82 * (1 - easeOut((progress - 0.08) / 0.64, 3.6))
  if (progress < 0.82) return -6 * Math.sin(Math.PI * ((progress - 0.72) / 0.1))
  return 0
}

function wreathSlide(progress: number, live: boolean) {
  if (!live) return 0
  if (progress <= 0.08) return -90
  if (progress >= 0.42) return 0
  return -90 * (1 - easeOut((progress - 0.08) / 0.34, 2.6))
}

function Wreath({
  glyph,
  className,
  locked,
  rotateY = 0,
  x = 0,
  idle = false,
  idleDelay = 0,
}: {
  glyph: string
  className: string
  locked?: boolean
  rotateY?: number
  x?: number
  idle?: boolean
  idleDelay?: number
}) {
  const facing = Math.abs(Math.cos((rotateY * Math.PI) / 180))
  const showGlyph = facing > 0.28

  return (
    <div className="relative" style={{ perspective: 1400 }}>
      {(locked || idle) && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[16%] left-1/2 h-14 w-32 -translate-x-1/2 rounded-full bg-amber-300/30 blur-2xl"
          animate={{ opacity: [0.28, 0.55, 0.28], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.div
        className={`relative overflow-hidden ${className}`}
        style={
          idle
            ? { transformStyle: 'preserve-3d', filter: 'brightness(1)', willChange: 'transform' }
            : {
                transform: `translateX(${x}px) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
                filter: `brightness(${0.52 + 0.48 * facing})`,
                willChange: 'transform',
              }
        }
        animate={idle ? { rotateY: [0, 10, 0, -10, 0] } : undefined}
        transition={
          idle
            ? { duration: 7.2, delay: idleDelay, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        <img src={PODIUM} alt="" className="absolute inset-0 h-full w-full object-contain" />
        {(locked || idle) && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ x: '-85%', opacity: 0 }}
            animate={{ x: '85%', opacity: [0, 0.85, 0] }}
            transition={{ duration: 2.1, delay: 0.15 + idleDelay, repeat: Infinity, repeatDelay: 3.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background:
                'linear-gradient(108deg, transparent 38%, rgba(255,245,210,0.0) 44%, rgba(255,255,255,0.42) 50%, rgba(255,214,120,0.12) 54%, transparent 62%)',
              mixBlendMode: 'screen',
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-[16%] top-[9%] z-10 flex h-[48%] items-center justify-center">
          <AnimatePresence mode="wait">
            {showGlyph && (
              <motion.span
                key={glyph}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.28, ease: EASE }}
                className={`flex h-[1.05em] w-[1.05em] items-center justify-center font-serif font-black leading-none ${
                  locked ? 'text-amber-200' : 'text-amber-200/40'
                }`}
                style={{ fontSize: '1.7em' }}
              >
                {glyph}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

function Marks({ done, active }: { done: number; active: number }) {
  return (
    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
      {[5, 4, 3, 2, 1].map((rank, i) => {
        const filled = done >= i + 1
        const current = rank === active && !filled
        return (
          <span
            key={rank}
            className={`h-[3px] rounded-full transition-[width,background-color] duration-700 ${
              filled ? 'w-7 bg-amber-300' : current ? 'w-4 bg-white/50' : 'w-2 bg-white/15'
            }`}
          />
        )
      })}
    </div>
  )
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[min(70vh,680px)] w-full items-center justify-center overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.72, 1, 0.72] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(ellipse 42% 48% at 50% 44%, rgba(245,158,11,0.16), transparent 68%)',
        }}
      />
      {children}
    </div>
  )
}

function PlaceReveal({
  entry,
  rank,
  progress,
  isAnimating,
  tick,
  completedSteps,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
  tick: number
  completedSteps: number
}) {
  const revealed = !isAnimating || progress >= 0.88
  const numberOn = revealed
  const nameLive = progress >= 0.24
  const scoreT = !isAnimating ? 1 : clamp((progress - 0.90) / 0.10)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const liveName = useMemo(
    () => scrambleName(entry?.teamName || '', progress, tick),
    [entry?.teamName, progress, tick],
  )
  const yaw = wreathYaw(progress, isAnimating)
  const slide = wreathSlide(progress, isAnimating)
  const wreathVisible = !isAnimating || progress >= 0.06
  const meta = PLACE[rank]

  return (
    <Stage>
      <motion.div
        key={`place-${rank}`}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 text-center"
        animate={revealed && isAnimating ? { scale: [1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-[13px] font-medium tracking-[0.34em] text-white/45 uppercase"
        >
          {meta.kicker}
        </motion.p>
        <motion.span
          aria-hidden
          className="mt-3 h-px w-9 origin-center bg-amber-200/55"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        />

        <div
          className={`mt-7 transition-opacity duration-500 ${wreathVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <Wreath
            className="h-[210px] w-[230px] sm:h-[248px] sm:w-[272px]"
            glyph={numberOn ? String(rank) : '?'}
            locked={numberOn}
            rotateY={yaw}
            x={slide}
            idle={revealed}
          />
        </div>

        <div className="mt-5 flex h-[7.5rem] w-full flex-col items-center justify-start sm:h-[8.5rem]">
          {nameLive ? (
            <motion.h2
              key={revealed ? 'locked' : 'spin'}
              initial={revealed ? { opacity: 0, y: 14, filter: 'blur(6px)' } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: revealed ? 0.55 : 0.25, ease: EASE }}
              className={`max-w-[18ch] text-balance font-black tracking-tight sm:max-w-[22ch] ${
                revealed
                  ? 'text-[2.35rem] text-white sm:text-6xl'
                  : 'font-mono text-[1.65rem] text-white/35 sm:text-4xl'
              }`}
            >
              {revealed ? (entry?.teamName || 'Unavailable') : liveName}
            </motion.h2>
          ) : (
            <span className="mt-6 h-[2px] w-16 bg-white/15" />
          )}

          <div className="mt-3 h-6">
            {revealed && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
                className="text-sm text-white/40 sm:text-base"
              >
                {entry?.college || 'Tamil Nadu'}
                {track ? ` · ${track.label}` : ''}
              </motion.p>
            )}
          </div>
        </div>

        <div className="mt-1 h-16">
          {revealed && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              className="font-black tabular-nums leading-none text-amber-200 text-[2.6rem] sm:text-5xl"
            >
              {score.toFixed(1)}
            </motion.p>
          )}
        </div>
      </motion.div>
      <Marks done={completedSteps} active={rank} />
    </Stage>
  )
}

function Cut({ title, line }: { title: string; line?: string }) {
  return (
    <Stage>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 px-8 text-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-5xl font-black tracking-tight text-white sm:text-7xl"
        >
          {title}
        </motion.h2>
        {line && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-5 text-base text-white/40 sm:text-lg"
          >
            {line}
          </motion.p>
        )}
      </motion.div>
    </Stage>
  )
}

function HoldBar() {
  return (
    <Stage>
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <div className="h-[2px] w-56 overflow-hidden bg-white/10 sm:w-80">
          <motion.div
            className="h-full origin-left bg-amber-300"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.15, ease: EASE }}
          />
        </div>
      </div>
    </Stage>
  )
}

function FinalTwo() {
  return (
    <Stage>
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[13px] font-medium uppercase tracking-[0.34em] text-white/40"
        >
          Grand finale
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="mt-4 text-4xl font-black text-white sm:text-6xl"
        >
          The final two
        </motion.h2>
        <div className="mt-12 flex items-center justify-center gap-6 sm:gap-16">
          <motion.div
            initial={{ x: -80, opacity: 0, rotateY: -78 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.55, ease: EASE }}
            style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
          >
            <Wreath className="h-[188px] w-[206px] sm:h-[220px] sm:w-[240px]" glyph="?" idle idleDelay={1.6} />
          </motion.div>
          <motion.span
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5, ease: EASE }}
            className="h-16 w-px bg-white/25 sm:h-24"
          />
          <motion.div
            initial={{ x: 80, opacity: 0, rotateY: 78 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.55, ease: EASE }}
            style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
          >
            <Wreath className="h-[188px] w-[206px] sm:h-[220px] sm:w-[240px]" glyph="?" idle idleDelay={1.75} />
          </motion.div>
        </div>
      </div>
    </Stage>
  )
}

function Champion({
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
    ? 'count'
    : elapsed < 6_200
    ? 'hold'
    : elapsed < 7_200
    ? 'black'
    : elapsed < 8_600
    ? 'spark'
    : 'flash'
  const n = Math.max(1, 5 - Math.floor(elapsed / 1_000))
  const scoreT = finished ? 1 : clamp((elapsed - 11_000) / 700)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null

  return (
    <Stage>
      <AnimatePresence mode="wait">
        {(stage === 'count' || stage === 'hold') && (
          <motion.div
            key={`n-${n}`}
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0, scale: stage === 'hold' ? 1.04 : 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative z-10 flex flex-col items-center"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.34em] text-white/35">
              Champion in
            </p>
            <p className="mt-2 font-black tabular-nums leading-none text-white text-[9rem] sm:text-[11rem]">
              {n}
            </p>
          </motion.div>
        )}
        {stage === 'black' && (
          <motion.div key="black" className="absolute inset-0 bg-black" />
        )}
        {stage === 'spark' && (
          <motion.div key="spark" className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 9], opacity: [0, 1, 0] }}
              transition={{ duration: 1.1, ease: EASE }}
              className="h-2 w-2 rounded-full bg-amber-100"
            />
          </motion.div>
        )}
        {stage === 'flash' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.42 }}
            className="absolute inset-0 bg-white"
          />
        )}
        {stage === 'winner' && (
          <motion.div
            key="win"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, ease: EASE }}
            className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 text-center"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.34em] text-amber-300/90">
              Grand Champion
            </p>
            <motion.div
              initial={{ rotateY: 74, scale: 0.94 }}
              animate={{ rotateY: 0, scale: 1 }}
              transition={{ duration: 1.15, ease: EASE }}
              className="mt-6"
              style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
            >
              <Wreath className="h-[230px] w-[252px] sm:h-[268px] sm:w-[294px]" glyph="1" locked idle idleDelay={1.2} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
              className="mt-5 max-w-[18ch] text-balance text-[2.5rem] font-black tracking-tight text-white sm:max-w-[22ch] sm:text-6xl"
            >
              {entry?.teamName || 'Unavailable'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="mt-3 text-sm text-white/40 sm:text-base"
            >
              {entry?.college || 'Tamil Nadu'}
              {track ? ` · ${track.label}` : ''}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5, ease: EASE }}
              className="mt-5 font-black tabular-nums leading-none text-amber-200 text-[2.8rem] sm:text-5xl"
            >
              {score.toFixed(1)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      {stage === 'winner' && <Marks done={5} active={1} />}
    </Stage>
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
    if (!(isAnimating || revealStep === 4 || revealStep === 5)) return
    let raf = 0
    const loop = () => {
      setNow(Date.now())
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [isAnimating, revealStep, stepStartedAt])

  const elapsed = Math.max(0, now - (stepStartedAt || now))
  const duration = Math.max(1, stepDurationMs)
  const progress = isAnimating ? clamp(elapsed / duration) : 1
  const tick = Math.floor(elapsed / 80)
  const rank = Math.max(1, 6 - revealStep)
  const entry = finalists.find((item) => item.rank === rank)
  const completedSteps = revealStep === 5
    ? (isAnimating ? 4 : 5)
    : Math.max(0, revealStep - (isAnimating ? 1 : 0))

  let scene: ReactNode
  let sceneKey = `place-${rank}`

  if (revealStep === 5) {
    scene = <Champion entry={entry} elapsed={elapsed} finished={!isAnimating} />
    sceneKey = 'champion'
  } else if (revealStep === 4 && !isAnimating) {
    const after = Math.max(0, elapsed - duration)
    if (after < 1100) {
      scene = (
        <PlaceReveal
          entry={entry}
          rank={rank}
          progress={1}
          isAnimating={false}
          tick={0}
          completedSteps={completedSteps}
        />
      )
      sceneKey = 'second-hold'
    } else if (after < 2400) {
      scene = <HoldBar />
      sceneKey = 'hold'
    } else if (after < 3600) {
      scene = <Cut title="Not yet." line="Two names still remain." />
      sceneKey = 'not-yet'
    } else if (after < 5200) {
      scene = <Cut title="Wait." />
      sceneKey = 'wait'
    } else {
      scene = <FinalTwo />
      sceneKey = 'final-two'
    }
  } else {
    scene = (
      <PlaceReveal
        entry={entry}
        rank={rank}
        progress={progress}
        isAnimating={isAnimating}
        tick={tick}
        completedSteps={completedSteps}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        {scene}
      </motion.div>
    </AnimatePresence>
  )
}
