import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getTrackConfig } from '@/lib/utils'
import { playFinaleRevealBed, stopFinaleRevealBed } from '@/lib/finaleRevealAudio'

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
  /** Optional place titles (e.g. Special Team Winner / Runner). Defaults to Grand Finale kickers. */
  placeKickers?: Partial<Record<number, string>>
}

const PLACE: Record<number, { kicker: string }> = {
  1: { kicker: 'Grand Champion' },
  2: { kicker: 'Second Place' },
  3: { kicker: 'Third Place' },
  4: { kicker: 'Fourth Place' },
  5: { kicker: 'Fifth Place' },
}

function placeKicker(rank: number, overrides?: Partial<Record<number, string>>) {
  return overrides?.[rank] || PLACE[rank]?.kicker || `Place ${rank}`
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const PODIUM = '/images/finale-podium-transparent.png'
const EASE = [0.22, 1, 0.36, 1] as const

function clamp(n: number) {
  return Math.min(1, Math.max(0, n))
}

function easeOut(t: number, power = 3.4) {
  return 1 - Math.pow(1 - clamp(t), power)
}

/** Shared place-reveal phase map (fraction of the reveal beat after any 5th preface). */
export const PLACE_CROWN_END = 0.32
export const PLACE_COUNT_END = 0.52
export const PLACE_ROLL_END = 0.82

/** Rise + scroll-spin the laurel, then lock face-on before countdown. */
function wreathYaw(progress: number, live: boolean, tease = false) {
  if (!live) return 0
  if (progress >= PLACE_CROWN_END) return 0
  const t = clamp(progress / PLACE_CROWN_END)
  const eased = easeOut(t, 2.35)
  // Edge-on start, then scroll ~1+ turns so the crown clearly "rolls" before lock.
  const turns = tease ? 0.9 : 1.2
  return (95 + turns * 360) * (1 - eased)
}

function wreathRise(progress: number, live: boolean) {
  if (!live) return 0
  if (progress <= 0.02) return 110
  if (progress >= PLACE_CROWN_END * 0.75) return 0
  return 110 * (1 - easeOut(progress / (PLACE_CROWN_END * 0.75), 3.0))
}

function lockSweep(progress: number, live: boolean, _tease: boolean) {
  if (!live) return -1
  const start = PLACE_CROWN_END - 0.04
  const t = (progress - start) / 0.08
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
            width: '54%',
            height: '38%',
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
                style={{ fontSize: '2.15em' }}
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

function flapGlyph(elapsed: number, index: number, rollT: number) {
  // Slow split-flap — starts lively, eases slower toward lock. rollT is 0→1 within rolling only.
  const interval = 110 + clamp(rollT) * 220
  const n = Math.floor(elapsed / interval) + index * 7
  return ALPHA[Math.abs(n) % ALPHA.length]
}

function placeCountdownDigit(p: number) {
  const t = clamp((p - PLACE_CROWN_END) / (PLACE_COUNT_END - PLACE_CROWN_END))
  if (t < 0.2) return 5
  if (t < 0.4) return 4
  if (t < 0.6) return 3
  if (t < 0.8) return 2
  return 1
}

function NameWait({
  phase,
  digit,
  rollElapsed,
  rollT,
}: {
  phase: 'count' | 'roll'
  digit: number
  rollElapsed: number
  rollT: number
}) {
  if (phase === 'count') {
    return (
      <motion.div
        key={`count-${digit}`}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -22 }}
        transition={{ duration: 0.38, ease: EASE }}
        className="flex flex-col items-center"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/35">
          Name in
        </p>
        <p className="mt-1 font-black tabular-nums leading-none text-white text-8xl sm:text-9xl">
          {digit}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="roll"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(8px)', y: -8 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mt-6 flex flex-col items-center sm:mt-8"
    >
      <div className="flex items-center gap-1.5 sm:gap-2" style={{ perspective: 700 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const glyph = flapGlyph(rollElapsed, i, rollT)
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
                  transition={{ duration: 0.18, ease: 'easeOut' }}
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

const STAGE_BG = '/videos/finale-stage-bg.mp4'
/** Shared Top 5 place beat (4th–2nd + 5th after rain/hold): countdown → roll → name. */
export const FINALE_BEAT_MS = 28_000
/** 5th place opens with a slow word rain, then a held pause, then the shared reveal beat. */
export const FIFTH_RAIN_MS = 8_000
export const FIFTH_HOLD_MS = 5_000
export const FIFTH_PREFACE_MS = FIFTH_RAIN_MS + FIFTH_HOLD_MS
export const FIFTH_TOTAL_MS = FIFTH_PREFACE_MS + FINALE_BEAT_MS
/** Grand Champion popup: countdown → rolling → winner hold. */
export const CHAMPION_COUNT_MS = 6_000
export const CHAMPION_ROLL_MS = 6_000
export const CHAMPION_WIN_AT_MS = CHAMPION_COUNT_MS + CHAMPION_ROLL_MS
export const CHAMPION_TOTAL_MS = 22_000

function StageMedia({
  mediaKey,
  playMedia,
}: {
  mediaKey: number
  playMedia: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    if (!playMedia) return
    el.muted = true
    el.loop = true
    void el.play().catch(() => {})
  }, [mediaKey, playMedia])

  return (
    <video
      key={mediaKey}
      ref={videoRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full min-h-full min-w-full object-cover"
      src={STAGE_BG}
      muted
      loop
      playsInline
      preload="auto"
    />
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
    <div className="relative z-10 flex h-full min-h-full w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,6,5,0.35) 0%, rgba(7,6,5,0.55) 45%, rgba(7,6,5,0.72) 100%)',
        }}
      />
      {cinematic && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 78% 88% at 50% 46%, transparent 8%, rgba(0,0,0,0.55) 100%)',
            opacity: 1 - open * 0.35,
          }}
        />
      )}
      {cinematic && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-14%] h-[80%] w-[min(54%,30rem)] -translate-x-1/2"
          style={{
            opacity: open * 0.7,
            background:
              'linear-gradient(180deg, rgba(245,214,140,0.12) 0%, rgba(232,197,71,0.05) 40%, transparent 100%)',
            clipPath: 'polygon(38% 0%, 62% 0%, 96% 100%, 4% 100%)',
            filter: 'blur(22px)',
          }}
        />
      )}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={settled ? { opacity: [0.55, 0.85, 0.55] } : undefined}
        transition={settled ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{
          opacity: settled ? undefined : 0.12 + open * 0.55,
          background: `radial-gradient(ellipse ${32 + open * 14}% ${38 + open * 14}% at 50% 40%, rgba(232,197,71,${0.04 + open * 0.08}), transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}

/** Soft rain of stage words — 5th place only. No place-rank words (avoids “Fourth/Fifth” ghosting in the title zone). */
const FALL_WORDS = [
  { text: 'SNAPSERVE', x: 8, size: '1.1rem', weight: 700, gold: true },
  { text: 'VOBIZ', x: 38, size: '1.05rem', weight: 700, gold: true },
  { text: 'zenXai', x: 68, size: '1rem', weight: 650, gold: true },
  { text: 'TELE CMI', x: 18, size: '0.95rem', weight: 600, gold: true },
  { text: 'RENDINGTON', x: 52, size: '0.95rem', weight: 600, gold: true },
  { text: 'VOICEATHON', x: 78, size: '0.9rem', weight: 500, gold: false },
  { text: 'GRAND FINALE', x: 30, size: '1.25rem', weight: 700, gold: true },
  { text: 'TOP 5', x: 88, size: '0.85rem', weight: 500, gold: false },
  { text: '2026', x: 12, size: '1.05rem', weight: 600, gold: false },
  { text: 'VOICE AI', x: 58, size: '0.85rem', weight: 500, gold: false },
  { text: 'CHAMPIONS', x: 42, size: '1.1rem', weight: 700, gold: true },
  { text: 'STAGE', x: 74, size: '0.8rem', weight: 500, gold: false },
  { text: 'UNSEAL', x: 24, size: '0.85rem', weight: 500, gold: false },
  { text: 'REVEAL', x: 84, size: '0.9rem', weight: 600, gold: false },
  { text: 'LIVE', x: 46, size: '0.75rem', weight: 500, gold: false },
  { text: 'PODIUM', x: 62, size: '0.85rem', weight: 500, gold: false },
  { text: 'FINALISTS', x: 34, size: '0.95rem', weight: 600, gold: true },
  { text: 'AWARD', x: 6, size: '0.8rem', weight: 500, gold: false },
  { text: 'CORONATION', x: 70, size: '0.85rem', weight: 600, gold: false },
  { text: 'NIGHT', x: 90, size: '0.75rem', weight: 500, gold: false },
] as const

function FallingWords({
  rain,
  hold = 0,
}: {
  /** 0→1 over the slow fall window */
  rain: number
  /** 0→1 after rain settles (hold beat); fades out toward 1 */
  hold?: number
}) {
  const fade = hold > 0.5 ? clamp((hold - 0.5) / 0.5) : 0
  if (rain <= 0 && hold <= 0) return null
  if (hold >= 1) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{ opacity: 1 - fade }}
    >
      {FALL_WORDS.map((word, i) => {
        // Stagger slowly across most of the rain window so words drift in, not dump.
        const start = (i / FALL_WORDS.length) * 0.42
        const local = clamp((rain - start) / 0.58)
        const settled = local >= 1 || hold > 0
        // Keep the top title zone clear — drift only through the lower two-thirds.
        const y = 32 + easeOut(local, 2.1) * (48 + (i % 5) * 4)
        const opacity =
          local <= 0
            ? 0
            : local < 0.1
            ? local / 0.1
            : settled
            ? 0.78
            : 0.42 + local * 0.36
        const rotate = settled
          ? (i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.4)
          : (1 - easeOut(local, 1.8)) * ((i % 2 === 0 ? -1 : 1) * (5 + (i % 3)))
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
  elapsed,
  durationMs,
  placeKickers,
}: {
  entry?: GrandFinaleEntry
  rank: number
  progress: number
  isAnimating: boolean
  elapsed: number
  durationMs: number
  placeKickers?: Partial<Record<number, string>>
}) {
  // 5th: slow rain → 5s hold → then the normal place reveal on the remaining beat.
  const isFifth = rank === 5
  const inRain = isFifth && isAnimating && elapsed < FIFTH_RAIN_MS
  const inHold =
    isFifth && isAnimating && elapsed >= FIFTH_RAIN_MS && elapsed < FIFTH_PREFACE_MS
  const inPreface = inRain || inHold
  const rainT = isFifth && isAnimating ? clamp(elapsed / FIFTH_RAIN_MS) : 0
  const holdT =
    isFifth && isAnimating && elapsed >= FIFTH_RAIN_MS
      ? clamp((elapsed - FIFTH_RAIN_MS) / FIFTH_HOLD_MS)
      : 0
  const revealSpan = Math.max(1, durationMs - (isFifth ? FIFTH_PREFACE_MS : 0))
  const p =
    !isAnimating
      ? 1
      : isFifth
      ? clamp((elapsed - FIFTH_PREFACE_MS) / revealSpan)
      : progress
  const revealLive = !isAnimating || !isFifth || !inPreface
  const tease = rank === 4
  // Sequence: crown scroll → crown lock → countdown → boxed roll → real name.
  const numberOn = revealLive && (!isAnimating || p >= PLACE_CROWN_END - 0.02)
  const inCount = revealLive && isAnimating && p >= PLACE_CROWN_END && p < PLACE_COUNT_END
  const inRoll = revealLive && isAnimating && p >= PLACE_COUNT_END && p < PLACE_ROLL_END
  const nameLive = revealLive && (!isAnimating || p >= PLACE_ROLL_END)
  const nameLocked = !isAnimating || p >= PLACE_ROLL_END
  const metaOn = revealLive && (!isAnimating || p >= PLACE_ROLL_END + 0.04)
  const scoreOn = revealLive && (!isAnimating || p >= PLACE_ROLL_END + 0.08)
  const scoreT = !isAnimating ? 1 : clamp((p - (PLACE_ROLL_END + 0.08)) / 0.08)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const yaw = wreathYaw(p, revealLive && isAnimating, tease)
  const rise = wreathRise(p, revealLive && isAnimating)
  const sweep = lockSweep(p, revealLive && isAnimating, tease)
  const wreathOpacity = !isAnimating
    ? 1
    : !revealLive
    ? 0
    : p < 0.02
    ? 0
    : clamp((p - 0.02) / 0.1)
  const titleOn =
    !isAnimating || (inHold && holdT > 0.2) || (revealLive && p >= 0.02)
  const lineOn = titleOn
  const meta = { kicker: placeKicker(rank, placeKickers) }
  const revealElapsed = Math.max(0, elapsed - (isFifth ? FIFTH_PREFACE_MS : 0))
  const rollElapsed = Math.max(0, revealElapsed - PLACE_COUNT_END * revealSpan)
  const rollT = clamp((p - PLACE_COUNT_END) / (PLACE_ROLL_END - PLACE_COUNT_END))
  const countDigit = placeCountdownDigit(p)
  const stageProgress = !isAnimating
    ? 1
    : inPreface
    ? clamp(0.08 + rainT * 0.22 + holdT * 0.12)
    : p

  return (
    <Stage cinematic progress={stageProgress}>
      {isFifth && isAnimating && (inRain || inHold) && (
        <FallingWords rain={rainT} hold={inHold ? holdT : 0} />
      )}
      <motion.div
        key={`place-${rank}`}
        className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-start px-6 pt-[3.5vh] text-center sm:pt-[4.5vh]"
        style={{
          opacity: inRain ? 0 : inHold ? 0.45 + holdT * 0.55 : 1,
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: titleOn ? 1 : 0, y: titleOn ? 0 : 10 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="text-sm font-medium tracking-[0.38em] text-white/55 uppercase sm:text-base"
        >
          {meta.kicker}
        </motion.p>
        <motion.span
          aria-hidden
          className="mt-2.5 h-px w-[3.25rem] origin-center sm:w-16"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: lineOn ? 1 : 0, opacity: lineOn ? 1 : 0 }}
          transition={{ duration: 0.85, delay: lineOn ? 0.12 : 0, ease: EASE }}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(245,214,140,0.25) 18%, rgba(245,214,140,0.95) 50%, rgba(245,214,140,0.25) 82%, transparent 100%)',
            boxShadow: '0 0 10px rgba(245,214,140,0.28)',
          }}
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

        <div className="mt-4 flex min-h-[12rem] w-full flex-col items-center justify-start sm:min-h-[13.5rem]">
          <AnimatePresence mode="wait">
            {nameLive ? (
              <motion.h2
                key="locked-name"
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-[16ch] text-balance text-5xl font-black tracking-tight text-white sm:max-w-[20ch] sm:text-7xl lg:text-8xl"
              >
                {entry?.teamName || 'Unavailable'}
              </motion.h2>
            ) : inCount || inRoll ? (
              <motion.div key={inCount ? `c-${countDigit}` : 'roll'}>
                <NameWait
                  phase={inCount ? 'count' : 'roll'}
                  digit={countDigit}
                  rollElapsed={rollElapsed}
                  rollT={rollT}
                />
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
  placeKickers,
}: {
  secondEntry?: GrandFinaleEntry
  championEntry?: GrandFinaleEntry
  progress: number
  isAnimating: boolean
  placeKickers?: Partial<Record<number, string>>
}) {
  const p = isAnimating ? progress : 1
  // Keep both laurels inside the LCD frame — no off-screen slides.
  const SPREAD = 18
  const SWAPS = 5

  let secondLeft = 50 + SPREAD
  let champLeft = 50 - SPREAD
  let secondFront = true
  let backScale = 1
  let pick = 0

  if (p >= 0.05 && p < 0.68) {
    // Long face-off shuffle — names stay sealed as ???
    const sT = (p - 0.05) / 0.63
    const theta = sT * Math.PI * SWAPS
    const c = Math.cos(theta)
    secondLeft = 50 + SPREAD * c
    champLeft = 50 - SPREAD * c
    secondFront = Math.sin(theta) > 0
    const near = 1 - Math.min(1, Math.abs(c) / 0.5)
    backScale = 1 - 0.18 * near
  } else if (p >= 0.68 && p < 0.78) {
    // Brief hold at the slots — room still waiting.
    secondLeft = 50 + SPREAD
    champLeft = 50 - SPREAD
    secondFront = true
  } else if (p >= 0.78) {
    // Slow pick: runner-up glides to centre; champion dims but stays on-frame.
    pick = clamp((p - 0.78) / 0.14)
    secondLeft = 50 + SPREAD + (0 - SPREAD) * pick
    champLeft = 50 - SPREAD + (16 - (50 - SPREAD)) * pick // eases toward ~16%, never off-screen
  }

  const secondScale = p < 0.68 ? (secondFront ? 1 : backScale) : 1 + 0.1 * pick
  const champScale = p < 0.68 ? (secondFront ? backScale : 1) : 1 - 0.1 * pick
  const secondZ = p < 0.68 ? (secondFront ? 3 : 2) : 3
  const champZ = p < 0.68 ? (secondFront ? 2 : 3) : 2
  const secondOpacity = p < 0.68 ? (secondFront ? 1 : 0.72) : 1
  const champOpacity = p < 0.68 ? (secondFront ? 0.72 : 1) : Math.max(0.12, 1 - pick * 0.88)

  // Delay the "Second Place" identity — no sudden lock while champion is still mid-exit.
  const numberOn = p >= 0.9
  const titleSecond = p >= 0.88
  const smallLabels = p < 0.9 ? 1 : clamp(1 - (p - 0.9) / 0.05)
  const bigNameOn = p >= 0.92
  const metaOn = p >= 0.95
  const scoreOn = p >= 0.97
  const scoreT = clamp((p - 0.97) / 0.03)
  const score = Number(secondEntry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = secondEntry?.track ? getTrackConfig(secondEntry.track) : null
  const secondSweep = (() => {
    const t = (p - 0.9) / 0.05
    if (t <= 0 || t >= 1) return -1
    return t
  })()

  const laurelCls = 'h-[200px] w-[220px] sm:h-[248px] sm:w-[272px] lg:h-[280px] lg:w-[308px]'

  return (
    <Stage cinematic progress={p}>
      <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-start overflow-visible px-6 pt-[3.5vh] text-center sm:pt-[4.5vh]">
        <AnimatePresence mode="wait">
          <motion.p
            key={titleSecond ? 'second' : 'final-two'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.65, ease: EASE }}
            className="text-sm font-medium tracking-[0.38em] text-white/50 uppercase sm:text-base"
          >
            {titleSecond ? placeKicker(2, placeKickers) : 'The Final Two'}
          </motion.p>
        </AnimatePresence>
        <span
          aria-hidden
          className="mt-2.5 h-px w-[3.25rem] sm:w-16"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(245,214,140,0.25) 18%, rgba(245,214,140,0.95) 50%, rgba(245,214,140,0.25) 82%, transparent 100%)',
            boxShadow: '0 0 10px rgba(245,214,140,0.28)',
          }}
        />

        <div className="relative mt-8 h-[268px] w-full overflow-visible sm:h-[320px] lg:h-[356px]">
          {/* Champion laurel — stays sealed until Step 5; fades aside, never clipped */}
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
            <p
              aria-hidden
              className="mt-3 font-mono text-2xl font-bold tracking-[0.35em] text-white/25 sm:text-3xl"
              style={{ opacity: p < 0.78 ? 0.7 : Math.max(0, 0.7 - pick) }}
            >
              ???
            </p>
          </div>

          {/* Runner-up laurel — locks with "2" only after the pick settles */}
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
              transition={{ duration: 0.85, ease: EASE }}
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
  placeKickers,
}: {
  entry?: GrandFinaleEntry
  elapsed: number
  finished: boolean
  placeKickers?: Partial<Record<number, string>>
}) {
  // One 22s beat: countdown → rolling tiles → winner hold (until stepDuration ends).
  const COUNT_MS = CHAMPION_COUNT_MS
  const ROLL_MS = CHAMPION_ROLL_MS
  const WIN_AT = CHAMPION_WIN_AT_MS
  const stage = finished || elapsed >= WIN_AT
    ? 'winner'
    : elapsed < COUNT_MS
    ? 'count'
    : 'roll'
  const n = Math.max(1, 5 - Math.floor(elapsed / 1_200))
  const rollProgress = clamp((elapsed - COUNT_MS) / ROLL_MS)
  const scoreT = finished ? 1 : clamp((elapsed - WIN_AT) / 1_000)
  const score = Number(entry?.totalScore || 0) * (1 - Math.pow(1 - scoreT, 3))
  const track = entry?.track ? getTrackConfig(entry.track) : null
  const winOpen = finished ? 1 : clamp((elapsed - WIN_AT) / 1_100)
  const champSweep = (() => {
    if (stage !== 'winner' || finished) return -1
    const t = (elapsed - WIN_AT - 200) / 1_000
    if (t <= 0 || t >= 1) return -1
    return t
  })()

  return (
    <Stage cinematic={stage === 'winner'} progress={stage === 'winner' ? winOpen : 1}>
      <AnimatePresence mode="wait">
        {stage === 'count' && (
          <motion.div
            key={`n-${n}`}
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.45, ease: EASE }}
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
        {stage === 'roll' && (
          <motion.div
            key="champ-roll"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative z-10 flex flex-col items-center"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.34em] text-white/35">
              Unsealing champion
            </p>
            <div className="mt-8 flex items-center gap-1.5 sm:gap-2" style={{ perspective: 700 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const glyph = flapGlyph(elapsed - COUNT_MS, i, rollProgress)
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
                        transition={{ duration: 0.18, ease: 'easeOut' }}
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
              {placeKicker(1, placeKickers)}
            </p>
            <span
              aria-hidden
              className="mt-2.5 h-px w-[3.25rem] sm:w-16"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(245,214,140,0.25) 18%, rgba(245,214,140,0.95) 50%, rgba(245,214,140,0.25) 82%, transparent 100%)',
                boxShadow: '0 0 10px rgba(245,214,140,0.28)',
              }}
            />
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

/** Final board — all five places in one horizontal line after the champion popup. */
export function TopFiveLineup({ finalists }: { finalists: GrandFinaleEntry[] }) {
  const ordered = [5, 4, 3, 2, 1]
    .map((rank) => finalists.find((f) => f.rank === rank))
    .filter(Boolean) as GrandFinaleEntry[]

  return (
    <div className="relative h-full min-h-full w-full overflow-hidden">
      <StageMedia mediaKey={1} playMedia />
      <Stage cinematic progress={1}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-8"
        >
          <p className="text-sm font-medium tracking-[0.38em] text-amber-200/80 uppercase sm:text-base">
            Grand Finale · Top 5
          </p>
          <span
            aria-hidden
            className="mt-2.5 h-px w-20"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(245,214,140,0.25) 18%, rgba(245,214,140,0.95) 50%, rgba(245,214,140,0.25) 82%, transparent 100%)',
              boxShadow: '0 0 10px rgba(245,214,140,0.28)',
            }}
          />

          <div className="mt-10 flex w-full max-w-7xl items-end justify-center gap-2 sm:gap-4 lg:gap-6">
            {ordered.map((entry, i) => {
              const champ = entry.rank === 1
              const track = entry.track ? getTrackConfig(entry.track) : null
              return (
                <motion.div
                  key={entry.teamId || entry.rank}
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.08 * i, ease: EASE }}
                  className={`flex min-w-0 flex-1 flex-col items-center text-center ${
                    champ ? 'pb-2' : 'pb-0'
                  }`}
                >
                  <p
                    className={`text-[9px] font-medium uppercase tracking-[0.28em] sm:text-[10px] ${
                      champ ? 'text-amber-300/90' : 'text-white/40'
                    }`}
                  >
                    {PLACE[entry.rank]?.kicker || `Place ${entry.rank}`}
                  </p>
                  <div className="mt-3" style={{ transform: champ ? 'scale(1.08)' : 'scale(1)' }}>
                    <Wreath
                      className={
                        champ
                          ? 'h-[120px] w-[132px] sm:h-[150px] sm:w-[164px] lg:h-[168px] lg:w-[184px]'
                          : 'h-[96px] w-[105px] sm:h-[120px] sm:w-[132px] lg:h-[132px] lg:w-[145px]'
                      }
                      glyph={String(entry.rank)}
                      locked
                      idle
                      idleDelay={0.2 * i}
                    />
                  </div>
                  <h3
                    className={`mt-3 max-w-[9ch] text-balance font-black tracking-tight text-white sm:max-w-[11ch] ${
                      champ
                        ? 'text-lg sm:text-2xl lg:text-3xl'
                        : 'text-sm sm:text-base lg:text-lg'
                    }`}
                  >
                    {entry.teamName || '—'}
                  </h3>
                  <p className="mt-1 max-w-[14ch] truncate text-[10px] text-white/35 sm:text-xs">
                    {entry.college || 'Tamil Nadu'}
                    {track ? ` · ${track.label}` : ''}
                  </p>
                  <p
                    className={`mt-2 font-black tabular-nums leading-none ${
                      champ
                        ? 'text-amber-200 text-xl sm:text-2xl'
                        : 'text-amber-200/85 text-base sm:text-lg'
                    }`}
                  >
                    {Number(entry.totalScore || 0).toFixed(1)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </Stage>
    </div>
  )
}

export function GrandFinaleExperience({
  finalists,
  revealStep,
  isAnimating,
  stepStartedAt,
  stepDurationMs,
  placeKickers,
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

  // Restart muted stage video + Web Audio bed together for every Top 5 beat.
  // 5th place waits through rain + hold before the reveal score starts.
  useEffect(() => {
    if (!isAnimating || revealStep < 1) {
      stopFinaleRevealBed()
      return
    }
    const rank = Math.max(1, 6 - revealStep)
    const preface = rank === 5 ? FIFTH_PREFACE_MS : 0
    const bedMs = Math.max(1, stepDurationMs - preface)
    let timer: number | null = null
    if (preface > 0) {
      timer = window.setTimeout(() => playFinaleRevealBed(rank, bedMs), preface)
    } else {
      playFinaleRevealBed(rank, bedMs)
    }
    return () => {
      if (timer != null) window.clearTimeout(timer)
      stopFinaleRevealBed()
    }
  }, [isAnimating, revealStep, stepStartedAt, stepDurationMs])

  const elapsed = Math.max(0, now - (stepStartedAt || now))
  const duration = Math.max(1, stepDurationMs)
  const progress = isAnimating ? clamp(elapsed / duration) : 1
  const rank = Math.max(1, 6 - revealStep)
  const entry = finalists.find((item) => item.rank === rank)
  const playMedia = isAnimating && revealStep >= 1

  let scene: ReactNode
  let sceneKey = `place-${rank}`

  if (revealStep === 5) {
    scene = <Champion entry={entry} elapsed={elapsed} finished={!isAnimating} placeKickers={placeKickers} />
    sceneKey = 'champion'
  } else if (revealStep === 4) {
    scene = (
      <FinalTwoReveal
        secondEntry={finalists.find((item) => item.rank === 2)}
        championEntry={finalists.find((item) => item.rank === 1)}
        progress={progress}
        isAnimating={isAnimating}
        placeKickers={placeKickers}
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
        elapsed={elapsed}
        durationMs={duration}
        placeKickers={placeKickers}
      />
    )
  }

  return (
    <div className="relative h-full min-h-full w-full overflow-hidden rounded-none">
      <StageMedia mediaKey={stepStartedAt || revealStep} playMedia={playMedia} />
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 h-full min-h-full w-full"
        >
          {scene}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
