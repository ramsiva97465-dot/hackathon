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
    const lockAt = 0.88 + (i / Math.max(name.length, 1)) * 0.07
    if (progress >= 1 || (progress >= lockAt && i !== hold)) out += name[i]
    else out += ALPHA[(tick + i * 5) % ALPHA.length]
  }
  return out
}

function easeOut(t: number, power = 3.4) {
  return 1 - Math.pow(1 - clamp(t), power)
}

/** Rise first, still edge-on. Then turn to face. `tease` turns it away once. */
function wreathYaw(progress: number, live: boolean, tease = false) {
  if (!live) return 0
  if (progress <= 0.30) return 82
  if (!tease) {
    if (progress < 0.62) return 82 * (1 - easeOut((progress - 0.30) / 0.32, 3.8))
    if (progress < 0.70) return -4 * Math.sin(Math.PI * ((progress - 0.62) / 0.08))
    return 0
  }
  if (progress < 0.50) return 82 * (1 - easeOut((progress - 0.30) / 0.20, 3.4))
  if (progress < 0.54) return 0
  if (progress < 0.64) return 78 * easeOut((progress - 0.54) / 0.10, 2.2)
  if (progress < 0.75) return 78 * (1 - easeOut((progress - 0.64) / 0.11, 3.2))
  return 0
}

function wreathRise(progress: number, live: boolean) {
  if (!live) return 0
  if (progress <= 0.08) return 96
  if (progress >= 0.34) return 0
  return 96 * (1 - easeOut((progress - 0.08) / 0.26, 3.4))
}

function lockSweep(progress: number, live: boolean, tease: boolean) {
  if (!live) return -1
  const start = tease ? 0.72 : 0.66
  const t = (progress - start) / 0.13
  if (t <= 0 || t >= 1) return -1
  return t
}

function Wreath({
  glyph,
  className,
  locked,
  rotateY = 0,
  y = 0,
  sweep = -1,
  idle = false,
  idleDelay = 0,
}: {
  glyph: string
  className: string
  locked?: boolean
  rotateY?: number
  y?: number
  sweep?: number
  idle?: boolean
  idleDelay?: number
}) {
  const facing = Math.abs(Math.cos((rotateY * Math.PI) / 180))
  const showGlyph = facing > 0.28
  const mask = {
    WebkitMaskImage: `url(${PODIUM})`,
    maskImage: `url(${PODIUM})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  } as const

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
                transform: `translateY(${y}px) rotateY(${rotateY}deg)`,
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
        {sweep >= 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={mask}>
            <div
              className="absolute top-[-20%] h-[140%] w-[16%]"
              style={{
                left: `${-28 + sweep * 148}%`,
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 36%, rgba(255,255,255,0.72) 50%, rgba(255,214,120,0.2) 58%, transparent 100%)',
                filter: 'blur(8px)',
                mixBlendMode: 'screen',
                opacity: sweep < 0.1 || sweep > 0.9 ? 0.4 : 1,
              }}
            />
          </div>
        )}
        {(locked || idle) && sweep < 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={mask}>
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

const SEAL_DOTS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 - Math.PI / 2
  return { cx: 50 + Math.cos(a) * 38, cy: 50 + Math.sin(a) * 38 }
})

function flapGlyph(elapsed: number, index: number, progress: number) {
  const interval = 48 + clamp(progress / 0.44) * 130
  const n = Math.floor(elapsed / interval) + index * 7
  return ALPHA[Math.abs(n) % ALPHA.length]
}

function isStamping(progress: number) {
  return progress < 0.30
}

function isNameCountdown(progress: number) {
  return progress >= 0.46 && progress < 0.88
}

function nameCountdown(progress: number) {
  const t = clamp((progress - 0.46) / 0.42)
  if (t < 0.38) return 3
  if (t < 0.70) return 2
  return 1
}

function WaxStamp({ slamming, progress }: { slamming?: boolean; progress: number }) {
  const t = clamp((progress - 0.10) / 0.12)
  const falling = progress < 0.10
  const justHit = progress >= 0.22 && progress < 0.30
  const landed = progress >= 0.22 || slamming
  const drop = falling ? -108 : landed ? 0 : -108 * (1 - t * t * t)
  const tilt = falling ? -16 : landed ? 0 : -16 * (1 - t)
  const squash = !landed && t > 0.82 ? 0.9 + (1 - t) * 0.4 : 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={slamming ? { opacity: 1, scale: [1.16, 0.94, 1] } : { opacity: 1 }}
      exit={{ opacity: 0, y: -32, rotate: -10, filter: 'blur(8px)' }}
      transition={{ duration: slamming ? 0.4 : 0.3, ease: EASE }}
      className="relative flex flex-col items-center"
      style={{
        transform: `translateY(${drop}px) rotate(${tilt}deg) scaleY(${squash})`,
        transformOrigin: 'center bottom',
      }}
    >
      {justHit && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/70"
          initial={{ scale: 0.55, opacity: 0.8 }}
          animate={{ scale: 1.85, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        />
      )}
      <svg viewBox="0 0 100 100" className="relative h-[5.5rem] w-[5.5rem] sm:h-[6.75rem] sm:w-[6.75rem]" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="#7A5410" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#E8C547" strokeWidth="3.2" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#C9A227" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="33" fill="#140E06" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#D4AF37" strokeWidth="1.1" />
        {SEAL_DOTS.map((dot) => (
          <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r="1.7" fill="#F5E6A8" />
        ))}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="#F5E6A8"
          fontSize="28"
          fontFamily="Georgia, serif"
          fontWeight="700"
        >
          ?
        </text>
      </svg>
    </motion.div>
  )
}

function NameWait({
  progress,
  elapsed,
  slamming,
}: {
  progress: number
  elapsed: number
  slamming?: boolean
}) {
  const counting = isNameCountdown(progress)
  const n = nameCountdown(progress)

  if (isStamping(progress) || slamming) {
    return <WaxStamp slamming={slamming} progress={slamming ? 1 : progress} />
  }

  if (counting) {
    return (
      <motion.div
        key={`count-${n}`}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -22 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="flex flex-col items-center"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/35">
          Name in
        </p>
        <p className="mt-1 font-black tabular-nums leading-none text-white text-8xl sm:text-9xl">
          {n}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={slamming ? { opacity: 1, y: 0, scale: [1.08, 0.96, 1] } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(8px)', y: -8 }}
      transition={{ duration: slamming ? 0.4 : 0.45, ease: EASE }}
      className="flex flex-col items-center"
    >
      <div className="flex items-center gap-1.5 sm:gap-2" style={{ perspective: 700 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const glyph = flapGlyph(elapsed, i, progress)
          return (
            <div
              key={i}
              className="relative h-14 w-11 overflow-hidden rounded-sm border border-white/12 bg-[#0A0908] sm:h-[4.25rem] sm:w-14"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 8px 20px rgba(0,0,0,.45)' }}
            >
              <span className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-black/70" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`${i}-${glyph}`}
                  initial={{ y: '70%', opacity: 0.35 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-70%', opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold text-white/80 sm:text-3xl"
                >
                  {glyph}
                </motion.span>
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.32em] text-white/30">
        Rolling
      </p>
    </motion.div>
  )
}

function Stage({
  children,
  progress = 1,
  cinematic = false,
}: {
  children: ReactNode
  progress?: number
  cinematic?: boolean
}) {
  const open = cinematic ? clamp((progress - 0.02) / 0.26) : 1
  const settled = !cinematic || progress >= 0.94

  return (
    <div className="relative flex min-h-[min(78vh,760px)] w-full items-center justify-center overflow-hidden">
      {cinematic && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 78% 88% at 50% 46%, transparent 8%, rgba(0,0,0,0.88) 100%)',
            opacity: 1 - open * 0.45,
          }}
        />
      )}
      {cinematic && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-14%] h-[80%] w-[min(54%,30rem)] -translate-x-1/2"
          style={{
            opacity: open * 0.88,
            background:
              'linear-gradient(180deg, rgba(245,214,140,0.15) 0%, rgba(232,197,71,0.06) 40%, transparent 100%)',
            clipPath: 'polygon(38% 0%, 62% 0%, 96% 100%, 4% 100%)',
            filter: 'blur(22px)',
          }}
        />
      )}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={settled ? { opacity: [0.8, 1, 0.8] } : undefined}
        transition={settled ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{
          opacity: settled ? undefined : 0.18 + open * 0.82,
          background: `radial-gradient(ellipse ${32 + open * 14}% ${38 + open * 14}% at 50% 40%, rgba(232,197,71,${0.05 + open * 0.11}), transparent 70%)`,
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
  const nameFakeOut = rank === 3 && isAnimating && progress >= 0.90 && progress < 0.935
  const numberOn = !isAnimating || progress >= (tease ? 0.75 : 0.70)
  const nameLive = (!isAnimating || progress >= 0.88) && !nameFakeOut
  const nameLocked = !isAnimating || progress >= 0.94
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
  const rise = wreathRise(progress, isAnimating)
  const sweep = lockSweep(progress, isAnimating, tease)
  const wreathOpacity = !isAnimating ? 1 : progress < 0.07 ? 0 : clamp((progress - 0.07) / 0.14)
  const titleOn = !isAnimating || progress >= 0.03
  const lineOn = !isAnimating || progress >= 0.10
  const meta = PLACE[rank]

  return (
    <Stage cinematic progress={isAnimating ? progress : 1}>
      <motion.div
        key={`place-${rank}`}
        className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: titleOn ? 1 : 0, y: titleOn ? 0 : 10 }}
          transition={{ duration: 0.85, ease: EASE }}
          className="text-sm font-medium tracking-[0.38em] text-white/50 uppercase sm:text-base"
        >
          {meta.kicker}
        </motion.p>
        <motion.span
          aria-hidden
          className="mt-3 h-px w-12 origin-center bg-amber-200/55"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: lineOn ? 1 : 0, opacity: lineOn ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        />

        <div className="mt-6" style={{ opacity: wreathOpacity }}>
          <Wreath
            className="h-[300px] w-[328px] sm:h-[380px] sm:w-[416px] lg:h-[420px] lg:w-[460px]"
            glyph={numberOn ? String(rank) : '?'}
            locked={numberOn}
            rotateY={yaw}
            y={rise}
            sweep={sweep}
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
              <motion.div
                key={
                  nameFakeOut || isStamping(progress)
                    ? `stamp-${nameFakeOut ? 'slam' : 'drop'}`
                    : isNameCountdown(progress)
                    ? `c-${nameCountdown(progress)}`
                    : 'roll'
                }
              >
                <NameWait slamming={nameFakeOut} progress={progress} elapsed={elapsed} />
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
  const winOpen = finished ? 1 : clamp((elapsed - 11_000) / 900)
  const champSweep = (() => {
    if (stage !== 'winner' || finished) return -1
    const t = (elapsed - 11_080) / 800
    if (t <= 0 || t >= 1) return -1
    return t
  })()

  return (
    <Stage cinematic={stage === 'winner'} progress={stage === 'winner' ? winOpen : 1}>
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
              initial={{ rotateY: 72, y: 72, opacity: 0.2 }}
              animate={{ rotateY: 0, y: 0, opacity: 1 }}
              transition={{ duration: 1.35, ease: EASE }}
              className="mt-6"
              style={{ perspective: 1400, transformStyle: 'preserve-3d' }}
            >
              <Wreath
                className="h-[320px] w-[350px] sm:h-[400px] sm:w-[438px] lg:h-[440px] lg:w-[482px]"
                glyph="1"
                locked
                idle
                idleDelay={1.2}
                sweep={champSweep}
              />
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
