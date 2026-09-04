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

/**
 * Official SnapServe seal — drops from above and stamps hard.
 * Uses the real brand mark (no bar-by-bar logo rebuild).
 */
function SnapSeal({ slamming, progress }: { slamming?: boolean; progress: number }) {
  const t = clamp((progress - 0.08) / 0.14)
  const falling = progress < 0.08
  const justHit = progress >= 0.20 && progress < 0.30
  const landed = progress >= 0.20 || slamming
  const drop = falling ? -120 : landed ? 0 : -120 * (1 - t * t * t)
  const tilt = falling ? -14 : landed ? 0 : -14 * (1 - t)
  const squash = !landed && t > 0.82 ? 0.88 + (1 - t) * 0.45 : 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={slamming ? { opacity: 1, scale: [1.14, 0.92, 1] } : { opacity: 1 }}
      exit={{ opacity: 0, y: -36, rotate: -8, filter: 'blur(8px)' }}
      transition={{ duration: slamming ? 0.4 : 0.28, ease: EASE }}
      className="relative flex flex-col items-center"
      style={{
        transform: `translateY(${drop}px) rotate(${tilt}deg) scaleY(${squash})`,
        transformOrigin: 'center bottom',
      }}
    >
      {justHit && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/70"
          initial={{ scale: 0.5, opacity: 0.85 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        />
      )}
      <div
        className="relative flex h-[5.75rem] w-[5.75rem] items-center justify-center rounded-full sm:h-[7rem] sm:w-[7rem]"
        style={{
          background:
            'radial-gradient(circle at 35% 28%, #F0D78A 0%, #C9A227 42%, #7A5410 78%, #3D2A08 100%)',
          boxShadow:
            '0 10px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="absolute inset-[7%] rounded-full"
          style={{
            border: '1.5px solid rgba(245,230,168,0.55)',
            boxShadow: 'inset 0 0 0 1px rgba(90,55,10,0.45)',
          }}
        />
        <div
          className="relative z-10 flex h-[68%] w-[68%] items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 40%, #1A1208 0%, #0A0704 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.65)',
          }}
        >
          <img
            src="/logos/Snaplogo.png.png"
            alt=""
            draggable={false}
            className="h-[58%] w-[58%] object-contain"
            style={{ filter: 'brightness(1.15) contrast(1.05)' }}
          />
        </div>
      </div>
      {landed && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.4, y: 0 }}
          className="mt-3 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/50"
        >
          Sealed
        </motion.p>
      )}
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
    return <SnapSeal slamming={slamming} progress={slamming ? 1 : progress} />
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

/** Soft rain of stage words — 5th place only. No bounce; ease-out settle then fade. */
const FALL_WORDS = [
  { text: 'SNAPSERVE', x: 6, size: '1.05rem', weight: 600, gold: true },
  { text: 'VOICEATHON', x: 64, size: '0.95rem', weight: 500, gold: false },
  { text: 'GRAND FINALE', x: 26, size: '1.4rem', weight: 700, gold: true },
  { text: 'TOP 5', x: 78, size: '0.85rem', weight: 500, gold: false },
  { text: 'FIFTH PLACE', x: 16, size: '1.6rem', weight: 800, gold: true },
  { text: '2026', x: 72, size: '1.15rem', weight: 600, gold: false },
  { text: 'VOICE AI', x: 40, size: '0.9rem', weight: 500, gold: false },
  { text: 'CHAMPIONS', x: 50, size: '1.25rem', weight: 700, gold: true },
  { text: 'STAGE', x: 10, size: '0.8rem', weight: 500, gold: false },
  { text: 'UNSEAL', x: 84, size: '0.85rem', weight: 500, gold: false },
  { text: 'REVEAL', x: 34, size: '1rem', weight: 600, gold: false },
  { text: 'RANK 5', x: 56, size: '1rem', weight: 600, gold: true },
  { text: 'LIVE', x: 22, size: '0.75rem', weight: 500, gold: false },
  { text: 'PODIUM', x: 68, size: '0.85rem', weight: 500, gold: false },
  { text: 'FINALISTS', x: 44, size: '1.05rem', weight: 600, gold: true },
  { text: 'AWARD', x: 8, size: '0.8rem', weight: 500, gold: false },
  { text: 'CORONATION', x: 58, size: '0.9rem', weight: 600, gold: false },
  { text: 'NIGHT', x: 76, size: '0.75rem', weight: 500, gold: false },
] as const

function FallingWords({ progress }: { progress: number }) {
  const rain = clamp(progress / 0.26)
  const hold = progress >= 0.22 && progress < 0.30
  const fade = progress >= 0.26 ? clamp((progress - 0.26) / 0.08) : 0
  if (progress >= 0.36) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{ opacity: 1 - fade }}
    >
      {FALL_WORDS.map((word, i) => {
        const start = (i / FALL_WORDS.length) * 0.55
        const local = clamp((rain - start) / 0.42)
        // Settle in the lower half (not mid) so the stage title stays readable above.
        const y = -8 + easeOut(local, 2.8) * (72 + (i % 5) * 5)
        const opacity = local <= 0 ? 0 : local < 0.12 ? local / 0.12 : hold ? 0.85 : 0.55 + local * 0.3
        const rotate = (1 - easeOut(local, 2.4)) * ((i % 2 === 0 ? -1 : 1) * (4 + (i % 3)))
        return (
          <span
            key={word.text}
            className="absolute whitespace-nowrap uppercase tracking-[0.22em]"
            style={{
              left: `${word.x}%`,
              top: `${y}%`,
              fontSize: word.size,
              fontWeight: word.weight,
              color: word.gold ? 'rgba(245,214,140,0.72)' : 'rgba(255,255,255,0.38)',
              opacity,
              transform: `rotate(${rotate}deg)`,
              willChange: 'transform, opacity',
            }}
          >
            {word.text}
          </span>
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
  tick,
  elapsed,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
  tick: number
  elapsed: number
}) {
  // 5th place: falling-word rain first, then remapped reveal timeline.
  const fifthRain = rank === 5 && isAnimating
  const p = fifthRain ? clamp((progress - 0.32) / 0.68) : progress
  const revealLive = !fifthRain || progress >= 0.30
  const tease = rank === 4
  const nameFakeOut = rank === 3 && isAnimating && p >= 0.90 && p < 0.935
  const numberOn = !isAnimating || p >= (tease ? 0.75 : 0.70)
  const nameLive = revealLive && (!isAnimating || p >= 0.88) && !nameFakeOut
  const nameLocked = !isAnimating || p >= 0.94
  const metaOn = revealLive && (!isAnimating || p >= 0.94)
  const scoreOn = revealLive && (!isAnimating || p >= 0.96)
  const scoreT = !isAnimating ? 1 : clamp((p - 0.96) / 0.04)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const liveName = useMemo(
    () => scrambleName(entry?.teamName || '', p, tick),
    [entry?.teamName, p, tick],
  )
  const yaw = wreathYaw(p, isAnimating && revealLive, tease)
  const rise = wreathRise(p, isAnimating && revealLive)
  const sweep = lockSweep(p, isAnimating && revealLive, tease)
  const wreathOpacity = !isAnimating
    ? 1
    : !revealLive
    ? 0
    : p < 0.07
    ? 0
    : clamp((p - 0.07) / 0.14)
  const titleOn = !isAnimating || (fifthRain ? progress >= 0.28 : p >= 0.03)
  const lineOn = !isAnimating || (fifthRain ? progress >= 0.32 : p >= 0.10)
  const meta = PLACE[rank]
  const waitProgress = revealLive ? p : 0
  const stageProgress = fifthRain ? clamp((progress - 0.18) / 0.82) : isAnimating ? progress : 1

  return (
    <Stage cinematic progress={stageProgress}>
      {fifthRain && <FallingWords progress={progress} />}
      <motion.div
        key={`place-${rank}`}
        className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 text-center"
        style={{ opacity: fifthRain && progress < 0.26 ? 0.15 + clamp((progress - 0.18) / 0.12) * 0.85 : 1 }}
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
            ) : revealLive ? (
              <motion.div
                key={
                  nameFakeOut || isStamping(waitProgress)
                    ? `stamp-${nameFakeOut ? 'slam' : 'drop'}`
                    : isNameCountdown(waitProgress)
                    ? `c-${nameCountdown(waitProgress)}`
                    : 'roll'
                }
              >
                <NameWait slamming={nameFakeOut} progress={waitProgress} elapsed={elapsed} />
              </motion.div>
            ) : null}
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
    </Stage>
  )
}

function FinalTwoReveal({
  secondEntry,
  championEntry,
  progress,
  isAnimating,
}: {
  secondEntry?: GrandFinaleEntry
  championEntry?: GrandFinaleEntry
  progress: number
  isAnimating: boolean
}) {
  const p = isAnimating ? progress : 1
  const SPREAD = 22 // % offset from centre for each slot
  const SWAPS = 6 // number of left↔right crossings during the shuffle

  // Horizontal position (in %) of each laurel plus depth cues.
  let secondLeft = 50 + SPREAD
  let champLeft = 50 - SPREAD
  let secondFront = true
  let backScale = 1
  let pick = 0

  if (p >= 0.06 && p < 0.64) {
    // The 10-second face-off: both laurels orbit through the centre and swap sides.
    const sT = (p - 0.06) / 0.58
    const theta = sT * Math.PI * SWAPS
    const c = Math.cos(theta)
    secondLeft = 50 + SPREAD * c
    champLeft = 50 - SPREAD * c
    secondFront = Math.sin(theta) > 0
    const near = 1 - Math.min(1, Math.abs(c) / 0.5) // 1 near the crossing, 0 at the slots
    backScale = 1 - 0.2 * near
  } else if (p >= 0.74) {
    // Pick: the runner-up glides to centre, the champion recedes and dims.
    pick = clamp((p - 0.74) / 0.16)
    secondLeft = 50 + SPREAD + (0 - SPREAD) * pick
    champLeft = 50 - SPREAD + (-34 - -SPREAD) * pick // slides out to the far left
  }

  const secondScale = p < 0.64 ? (secondFront ? 1 : backScale) : 1 + 0.12 * pick
  const champScale = p < 0.64 ? (secondFront ? backScale : 1) : 1 - 0.12 * pick
  const secondZ = secondFront ? 3 : 2
  const champZ = secondFront ? 2 : 3
  const secondOpacity = p < 0.64 ? (secondFront ? 1 : 0.72) : 1
  const champOpacity = p < 0.64 ? (secondFront ? 0.72 : 1) : 1 - pick * 0.9

  const numberOn = p >= 0.80
  const titleSecond = p >= 0.74
  const smallLabels = p < 0.80 ? 1 : clamp(1 - (p - 0.80) / 0.06)
  const bigNameOn = p >= 0.86
  const metaOn = p >= 0.90
  const scoreOn = p >= 0.94
  const scoreT = clamp((p - 0.94) / 0.06)
  const score = Number(secondEntry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = secondEntry?.track ? getTrackConfig(secondEntry.track) : null
  const secondSweep = (() => {
    const t = (p - 0.80) / 0.06
    if (t <= 0 || t >= 1) return -1
    return t
  })()

  const laurelCls = 'h-[200px] w-[220px] sm:h-[248px] sm:w-[272px] lg:h-[280px] lg:w-[308px]'

  return (
    <Stage cinematic progress={p}>
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={titleSecond ? 'second' : 'final-two'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-sm font-medium tracking-[0.38em] text-white/50 uppercase sm:text-base"
          >
            {titleSecond ? PLACE[2].kicker : 'The Final Two'}
          </motion.p>
        </AnimatePresence>
        <span aria-hidden className="mt-3 h-px w-12 bg-amber-200/55" />

        <div className="relative mt-8 h-[268px] w-full sm:h-[320px] lg:h-[356px]">
          {/* Champion laurel — stays sealed until Step 5 */}
          <div
            className="absolute top-0 flex flex-col items-center"
            style={{
              left: `${champLeft}%`,
              transform: 'translateX(-50%)',
              zIndex: champZ,
              opacity: champOpacity,
              willChange: 'left, opacity',
            }}
          >
            <div style={{ transform: `scale(${champScale})` }}>
              <Wreath className={laurelCls} glyph="?" />
            </div>
            {/* Names stay hidden during the face-off — suspense until 2nd locks. */}
            <p
              aria-hidden
              className="mt-3 font-mono text-2xl font-bold tracking-[0.35em] text-white/25 sm:text-3xl"
              style={{ opacity: p < 0.74 ? 0.7 : 1 - pick }}
            >
              ???
            </p>
          </div>

          {/* Runner-up laurel — locks with "2" */}
          <div
            className="absolute top-0 flex flex-col items-center"
            style={{
              left: `${secondLeft}%`,
              transform: 'translateX(-50%)',
              zIndex: secondZ,
              opacity: secondOpacity,
              willChange: 'left',
            }}
          >
            <div style={{ transform: `scale(${secondScale})` }}>
              <Wreath
                className={laurelCls}
                glyph={numberOn ? '2' : '?'}
                locked={numberOn}
                sweep={secondSweep}
                idle={!isAnimating}
              />
            </div>
            <p
              aria-hidden
              className="mt-3 font-mono text-2xl font-bold tracking-[0.35em] text-white/25 sm:text-3xl"
              style={{ opacity: smallLabels }}
            >
              ???
            </p>
          </div>
        </div>

        <div className="mt-2 flex min-h-[7rem] flex-col items-center justify-start sm:min-h-[8.5rem]">
          {bigNameOn && (
            <motion.h2
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="max-w-[16ch] text-balance text-5xl font-black tracking-tight text-white sm:max-w-[20ch] sm:text-7xl lg:text-8xl"
            >
              {secondEntry?.teamName || 'Unavailable'}
            </motion.h2>
          )}
          <div className="mt-3 h-6">
            {metaOn && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-sm text-white/40 sm:text-base"
              >
                {secondEntry?.college || 'Tamil Nadu'}
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

  let scene: ReactNode
  let sceneKey = `place-${rank}`

  if (revealStep === 5) {
    scene = <Champion entry={entry} elapsed={elapsed} finished={!isAnimating} />
    sceneKey = 'champion'
  } else if (revealStep === 4) {
    scene = (
      <FinalTwoReveal
        secondEntry={finalists.find((item) => item.rank === 2)}
        championEntry={finalists.find((item) => item.rank === 1)}
        progress={progress}
        isAnimating={isAnimating}
      />
    )
    sceneKey = 'final-two'
  } else {
    scene = (
      <PlaceReveal
        entry={entry}
        rank={rank}
        progress={progress}
        isAnimating={isAnimating}
        tick={tick}
        elapsed={elapsed}
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
