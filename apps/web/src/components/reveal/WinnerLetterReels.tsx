import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SPIN_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Cells in the looping strip. The last one repeats the first so the loop is seamless. */
const LOOP_CELLS = 12
const LOOP_MS = 420
/** Cells in the final decelerating pass that lands on the target letter. */
const LAND_CELLS = 8

function randomGlyph() {
  return SPIN_GLYPHS[Math.floor(Math.random() * SPIN_GLYPHS.length)]
}

function randomGlyphs(count: number) {
  return Array.from({ length: count }, randomGlyph)
}

type Size = 'lg' | 'md' | 'sm'

const SIZES: Record<Size, { cell: string; text: string; gap: string; space: string }> = {
  lg: { cell: 'w-11 h-16 sm:w-14 sm:h-20', text: 'text-3xl sm:text-4xl', gap: 'gap-1.5 sm:gap-2', space: 'w-4 sm:w-6' },
  md: { cell: 'w-8 h-12 sm:w-11 sm:h-16', text: 'text-xl sm:text-3xl', gap: 'gap-1 sm:gap-1.5', space: 'w-3 sm:w-5' },
  sm: { cell: 'w-6 h-9 sm:w-8 sm:h-12', text: 'text-sm sm:text-xl', gap: 'gap-0.5 sm:gap-1', space: 'w-2 sm:w-3' },
}

function sizeFor(longest: number): Size {
  if (longest <= 9) return 'lg'
  if (longest <= 15) return 'md'
  return 'sm'
}

function themeFor(dark: boolean) {
  return dark
    ? {
        frame: 'border-amber-400/35 bg-gradient-to-b from-[#2a1a06] via-[#0d0803] to-[#2a1a06] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-8px_18px_rgba(0,0,0,0.75)]',
        glyph: 'text-amber-100/75',
        locked:
          'border-amber-300/90 bg-gradient-to-b from-amber-300/30 via-amber-500/10 to-amber-300/25 text-amber-50 shadow-[0_0_26px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]',
        rail: 'from-transparent via-amber-400/60 to-transparent',
        kicker: 'text-amber-300/70',
      }
    : {
        frame: 'border-emerald-950/70 bg-gradient-to-b from-[#0f2a22] via-[#061410] to-[#0f2a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-8px_18px_rgba(0,0,0,0.6)]',
        glyph: 'text-emerald-200/70',
        locked:
          'border-emerald-600 bg-gradient-to-b from-white via-emerald-50 to-emerald-100 text-emerald-900 shadow-[0_0_24px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]',
        rail: 'from-transparent via-emerald-500/60 to-transparent',
        kicker: 'text-emerald-700/70',
      }
}

/** Glass gradient + centre line that make each cell read as a machine window. */
function CellSheen() {
  return (
    <>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
      <span className="pointer-events-none absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-white/10" />
    </>
  )
}

function SpinReel({
  target,
  lockAt,
  size,
  theme,
}: {
  target: string
  lockAt: number
  size: Size
  theme: ReturnType<typeof themeFor>
}) {
  const [phase, setPhase] = useState<'loop' | 'land' | 'locked'>('loop')
  const s = SIZES[size]

  const landMs = Math.min(720, Math.max(320, lockAt * 0.6))
  const loopStrip = useMemo(() => {
    const cells = randomGlyphs(LOOP_CELLS - 1)
    return [...cells, cells[0]]
  }, [])
  const landStrip = useMemo(() => [...randomGlyphs(LAND_CELLS - 1), target], [target])

  useEffect(() => {
    const toLand = window.setTimeout(() => setPhase('land'), Math.max(0, lockAt - landMs))
    const toLocked = window.setTimeout(() => setPhase('locked'), Math.max(0, lockAt))
    return () => {
      window.clearTimeout(toLand)
      window.clearTimeout(toLocked)
    }
  }, [lockAt, landMs])

  if (phase === 'locked') {
    return (
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
        className={`relative ${s.cell} rounded-xl border-2 flex items-center justify-center font-mono font-black ${s.text} ${theme.locked}`}
      >
        {target}
      </motion.div>
    )
  }

  const strip = phase === 'land' ? landStrip : loopStrip
  const travel = `-${(100 * (strip.length - 1)) / strip.length}%`

  return (
    <div className={`relative ${s.cell} rounded-xl border overflow-hidden ${theme.frame}`}>
      <motion.div
        key={phase}
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={{ y: '0%' }}
        animate={{ y: travel }}
        transition={
          phase === 'land'
            ? { duration: landMs / 1000, ease: [0.16, 1, 0.3, 1] }
            : { duration: LOOP_MS / 1000, ease: 'linear', repeat: Infinity }
        }
      >
        {strip.map((glyph, i) => (
          <span
            key={i}
            className={`${s.cell} flex items-center justify-center font-mono font-black ${s.text} ${theme.glyph}`}
          >
            {glyph}
          </span>
        ))}
      </motion.div>
      <CellSheen />
    </div>
  )
}

function IntroReel({
  glyph,
  index,
  size,
  theme,
}: {
  glyph: string
  index: number
  size: Size
  theme: ReturnType<typeof themeFor>
}) {
  const s = SIZES[size]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, rotateX: -60 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.045, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${s.cell} rounded-xl border-2 flex items-center justify-center font-mono font-black ${s.text} ${theme.locked}`}
    >
      {glyph}
    </motion.div>
  )
}

/**
 * Opens on the event wordmark, scrolls the reels, then lands on the winning team.
 * The whole sequence fits inside `spinMs` so the caller can swap in the static name after.
 */
export function WinnerLetterReels({
  name,
  spinning,
  spinMs = 5000,
  dark = false,
  introWord = 'VOICEATHON',
}: {
  name: string
  spinning: boolean
  spinMs?: number
  dark?: boolean
  introWord?: string
}) {
  const [stage, setStage] = useState<'intro' | 'spin'>(spinning ? 'intro' : 'spin')
  const theme = themeFor(dark)

  const introMs = Math.min(1400, Math.max(600, spinMs * 0.22))

  useEffect(() => {
    if (!spinning) {
      setStage('spin')
      return
    }
    setStage('intro')
    const toSpin = window.setTimeout(() => setStage('spin'), introMs)
    return () => window.clearTimeout(toSpin)
  }, [spinning, introMs, name])

  const chars = Array.from(name.toUpperCase())
  const letterCount = chars.filter(c => c !== ' ').length
  const size = sizeFor(Math.max(chars.length, introWord.length))
  const s = SIZES[size]

  if (letterCount === 0) {
    return (
      <p className={`font-mono font-black tracking-[0.3em] text-sm sm:text-base ${theme.kicker}`}>
        IDENTIFYING WINNER...
      </p>
    )
  }

  // Reels lock left to right, with the last one landing just before the caller swaps in the name.
  const available = Math.max(900, spinMs - introMs)
  const stagger = Math.min(180, Math.max(70, (available * 0.45) / Math.max(1, letterCount - 1)))
  const lastLock = available - 140
  const firstLock = Math.max(available * 0.3, lastLock - (letterCount - 1) * stagger)

  let reelIndex = 0

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <AnimatePresence mode="wait">
          {stage === 'intro' ? (
            <motion.div
              key="intro"
              exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`relative flex items-center justify-center ${s.gap} flex-wrap max-w-full px-1`}
              style={{ perspective: 800 }}
            >
              {Array.from(introWord.toUpperCase()).map((glyph, index) => (
                <IntroReel key={`${index}-${glyph}`} glyph={glyph} index={index} size={size} theme={theme} />
              ))}
              <motion.span
                aria-hidden
                initial={{ x: '-130%' }}
                animate={{ x: '230%' }}
                transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
                className="pointer-events-none absolute inset-y-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent mix-blend-overlay"
              />
            </motion.div>
          ) : (
            <motion.div
              key="spin"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-center ${s.gap} flex-wrap max-w-full px-1`}
            >
              {chars.map((ch, index) => {
                if (ch === ' ') {
                  return <div key={`gap-${index}`} className={s.space} aria-hidden />
                }
                const i = reelIndex++
                return (
                  <SpinReel
                    key={`${index}-${ch}`}
                    target={ch}
                    lockAt={firstLock + i * stagger}
                    size={size}
                    theme={theme}
                  />
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`h-px w-40 sm:w-56 bg-gradient-to-r ${theme.rail}`} aria-hidden />
      <motion.p
        key={stage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] ${theme.kicker}`}
      >
        {stage === 'intro' ? 'Voiceathon 2026' : 'Locking In The Winner'}
      </motion.p>
    </div>
  )
}
