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
    const lockAt = 0.80 + (i / Math.max(name.length, 1)) * 0.10
    if (progress >= 1 || (progress >= lockAt && i !== hold)) out += name[i]
    else out += ALPHA[(tick + i * 5) % ALPHA.length]
  }
  return out
}

function easeOut(t: number, power = 3.4) {
  return 1 - Math.pow(1 - clamp(t), power)
}

/** Edge-on → face-on. `tease` turns it away once after they think it has landed. */
function wreathYaw(progress: number, live: boolean, tease = false) {
  if (!live) return 0
  if (progress <= 0.10) return 82
  if (!tease) {
    if (progress < 0.56) return 82 * (1 - easeOut((progress - 0.10) / 0.46, 3.8))
    if (progress < 0.64) return -5 * Math.sin(Math.PI * ((progress - 0.56) / 0.08))
    return 0
  }
  if (progress < 0.46) return 82 * (1 - easeOut((progress - 0.10) / 0.36, 3.4))
  if (progress < 0.52) return 0
  if (progress < 0.62) return 78 * easeOut((progress - 0.52) / 0.10, 2.2)
  if (progress < 0.73) return 78 * (1 - easeOut((progress - 0.62) / 0.11, 3.2))
  return 0
}

function wreathSlide(progress: number, live: boolean) {
  if (!live) return 0
  if (progress <= 0.10) return -90
  if (progress >= 0.38) return 0
  return -90 * (1 - easeOut((progress - 0.10) / 0.28, 2.6))
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
        className={`relative ${className}`}
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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              WebkitMaskImage: `url(${PODIUM})`,
              maskImage: `url(${PODIUM})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          >
            <motion.div
              className="absolute top-[-20%] h-[140%] w-[18%]"
              initial={{ x: '-120%', opacity: 0 }}
              animate={{ x: '620%', opacity: [0, 1, 0] }}
              transition={{
                duration: 2.35,
                delay: 0.2 + idleDelay,
                repeat: Infinity,
                repeatDelay: 3.6,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.0) 38%, rgba(255,255,255,0.7) 50%, rgba(255,214,120,0.18) 58%, transparent 100%)',
                filter: 'blur(8px)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        )}
        <div
          className="pointer-events-none absolute z-10 flex items-center justify-center"
          style={{
            left: '50%',
            top: '42%',
            width: '46%',
            height: '32%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <AnimatePresence mode="wait">
            {showGlyph && (
              <motion.span
                key={glyph}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.28, ease: EASE }}
                className={`flex h-[1em] w-[1em] items-center justify-center text-center font-serif font-black leading-none ${
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

const SEAL_BARS = [
  { x: 2, y: 2, fill: '#F4F4F4' },
  { x: 11, y: 14, fill: '#A3A3A3' },
  { x: 20, y: 26, fill: '#5C5C5C' },
] as const

function SnapSeal({
  slamming,
  progress,
  elapsed,
}: {
  slamming?: boolean
  progress: number
  elapsed: number
}) {
  const barOn = (i: number) => progress >= 0.12 + i * 0.055 || progress >= 1
  const dotOn = (i: number) => progress >= 0.30 + i * 0.028 || progress >= 1
  const wordOn = progress >= 0.46 || progress >= 1
  const built = progress >= 0.48 || progress >= 1
  const tension = built ? clamp((progress - 0.48) / 0.34) : 0
  const tSec = elapsed / 1000
  const hz = 0.8 + tension * 2.8
  const phase = tSec * hz * Math.PI * 2
  const beat =
    Math.pow(Math.max(0, Math.sin(phase)), 10) +
    0.5 * Math.pow(Math.max(0, Math.sin(phase - 0.4)), 14)
  const scale = slamming ? 1 : 1 + beat * (0.04 + tension * 0.1)
  const shake = !slamming && tension > 0.42
    ? Math.sin(tSec * 42) * (tension - 0.42) * 4.2
    : 0
  const glow = 0.08 + beat * (0.22 + tension * 0.5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={
        slamming
          ? { opacity: 1, y: 0, scale: [1.2, 0.94, 1] }
          : { opacity: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 1.22, y: -14, filter: 'blur(10px)' }}
      transition={{ duration: slamming ? 0.42 : 0.55, ease: EASE }}
      className="relative flex flex-col items-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-5 h-[4.5rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-amber-300 blur-2xl"
        style={{ opacity: glow }}
      />
      <div
        style={{
          transform: `translateX(${shake}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="flex flex-col items-center"
      >
        <svg
          viewBox="0 0 48 36"
          className="relative h-12 w-16 sm:h-16 sm:w-[5.25rem]"
          aria-hidden
        >
          {SEAL_BARS.map((bar, i) => (
            <motion.rect
              key={bar.fill}
              x={bar.x}
              y={bar.y}
              height="8"
              rx="4"
              fill={bar.fill}
              initial={{ width: 0, opacity: 0 }}
              animate={barOn(i) ? { width: 26, opacity: 1 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.34, ease: EASE }}
            />
          ))}
        </svg>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="h-[5px] w-[5px] rounded-full bg-amber-200"
              initial={{ scale: 0, opacity: 0 }}
              animate={dotOn(i) ? { scale: 1, opacity: 0.85 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
            />
          ))}
        </div>

        <motion.span
          className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/50 sm:text-[11px]"
          initial={{ opacity: 0, y: 6, letterSpacing: '0.55em' }}
          animate={
            wordOn
              ? { opacity: 0.34 + beat * 0.42, y: 0, letterSpacing: `${0.34 + beat * 0.08}em` }
              : { opacity: 0, y: 6 }
          }
          transition={{ duration: 0.4, ease: EASE }}
        >
          Sealed
        </motion.span>
      </div>
    </motion.div>
  )
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[min(78vh,760px)] w-full items-center justify-center overflow-hidden">
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
  elapsed,
  completedSteps,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
  tick: number
  elapsed: number
  completedSteps: number
}) {
  const tease = rank === 4
  const nameFakeOut = rank === 3 && isAnimating && progress >= 0.835 && progress < 0.88
  const numberOn = !isAnimating || progress >= (tease ? 0.75 : 0.70)
  const nameLive = (!isAnimating || progress >= 0.82) && !nameFakeOut
  const nameLocked = !isAnimating || progress >= 0.91
  const metaOn = !isAnimating || progress >= 0.94
  const scoreOn = !isAnimating || progress >= 0.96
  const scoreT = !isAnimating ? 1 : clamp((progress - 0.96) / 0.04)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const liveName = useMemo(
    () => scrambleName(entry?.teamName || '', progress, tick),
    [entry?.teamName, progress, tick],
  )
  const yaw = wreathYaw(progress, isAnimating, tease)
  const slide = wreathSlide(progress, isAnimating)
  const wreathVisible = !isAnimating || progress >= 0.10
  const meta = PLACE[rank]

  return (
    <Stage>
      <motion.div
        key={`place-${rank}`}
        className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-sm font-medium tracking-[0.38em] text-white/50 uppercase sm:text-base"
        >
          {meta.kicker}
        </motion.p>
        <motion.span
          aria-hidden
          className="mt-3 h-px w-12 origin-center bg-amber-200/55"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
        />

        <div
          className={`mt-6 transition-opacity duration-700 ${wreathVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <Wreath
            className="h-[300px] w-[328px] sm:h-[380px] sm:w-[416px] lg:h-[420px] lg:w-[460px]"
            glyph={numberOn ? String(rank) : '?'}
            locked={numberOn}
            rotateY={yaw}
            x={slide}
            idle={nameLocked}
          />
        </div>

        <div className="mt-4 flex h-[8.5rem] w-full flex-col items-center justify-start sm:h-[10.5rem]">
          <AnimatePresence mode="wait">
            {nameLive ? (
              <motion.h2
                key={nameLocked ? 'locked' : 'spin'}
                initial={nameLocked ? { opacity: 0, y: 14, filter: 'blur(8px)' } : { opacity: 0 }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: nameLocked ? 0.7 : 0.35, ease: EASE }}
                className={`max-w-[16ch] text-balance font-black tracking-tight sm:max-w-[20ch] ${
                  nameLocked
                    ? 'text-5xl text-white sm:text-7xl lg:text-8xl'
                    : 'font-mono text-3xl text-white/40 sm:text-5xl'
                }`}
              >
                {nameLocked ? (entry?.teamName || 'Unavailable') : liveName}
              </motion.h2>
            ) : (
              <motion.div key={`seal-${nameFakeOut ? 'slam' : 'hold'}`}>
                <SnapSeal slamming={nameFakeOut} progress={progress} elapsed={elapsed} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 h-6">
            {metaOn && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-sm text-white/40 sm:text-base"
              >
                {entry?.college || 'Tamil Nadu'}
                {track ? ` · ${track.label}` : ''}
              </motion.p>
            )}
          </div>
        </div>

        <div className="mt-1 h-16 sm:h-20">
          {scoreOn && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="font-black tabular-nums leading-none text-amber-200 text-5xl sm:text-6xl lg:text-7xl"
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
            <Wreath className="h-[220px] w-[240px] sm:h-[280px] sm:w-[306px]" glyph="?" idle idleDelay={1.6} />
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
            <Wreath className="h-[220px] w-[240px] sm:h-[280px] sm:w-[306px]" glyph="?" idle idleDelay={1.75} />
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
              <Wreath className="h-[320px] w-[350px] sm:h-[400px] sm:w-[438px] lg:h-[440px] lg:w-[482px]" glyph="1" locked idle idleDelay={1.2} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
              className="mt-5 max-w-[16ch] text-balance text-5xl font-black tracking-tight text-white sm:max-w-[20ch] sm:text-7xl lg:text-8xl"
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
          elapsed={0}
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
        elapsed={elapsed}
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
