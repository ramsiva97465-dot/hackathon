import { useEffect, useState } from 'react'

const SPIN_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomGlyph() {
  return SPIN_GLYPHS[Math.floor(Math.random() * SPIN_GLYPHS.length)]
}

function LetterReel({
  target,
  index,
  spinning,
  spinMs,
  dark,
}: {
  target: string
  index: number
  spinning: boolean
  spinMs: number
  dark: boolean
}) {
  const [glyph, setGlyph] = useState(spinning ? randomGlyph() : target)
  const [locked, setLocked] = useState(!spinning)

  useEffect(() => {
    if (!spinning) {
      setGlyph(target)
      setLocked(true)
      return
    }

    setLocked(false)
    setGlyph(randomGlyph())
    const spin = window.setInterval(() => {
      setGlyph(randomGlyph())
    }, 45 + (index % 4) * 12)

    const letterIndex = index
    const stagger = 140
    const lockWindow = Math.min(letterIndex * stagger + stagger, Math.max(400, spinMs * 0.35))
    const stopAt = Math.max(400, spinMs - lockWindow)

    const stop = window.setTimeout(() => {
      window.clearInterval(spin)
      setGlyph(target)
      setLocked(true)
    }, stopAt)

    return () => {
      window.clearInterval(spin)
      window.clearTimeout(stop)
    }
  }, [spinning, target, index, spinMs])

  return (
    <div
      className={`w-7 h-11 sm:w-9 sm:h-14 rounded-lg border flex items-center justify-center font-mono font-black text-lg sm:text-2xl shadow-inner ${
        locked
          ? dark
            ? 'bg-amber-500/15 border-amber-400 text-amber-100'
            : 'bg-emerald-50 border-emerald-600 text-emerald-800'
          : dark
            ? 'bg-black/50 border-amber-700/60 text-amber-200/80'
            : 'bg-slate-900 border-emerald-800 text-emerald-100'
      }`}
    >
      {glyph}
    </div>
  )
}

/** One reel per character of the admin-selected team. Spaces become gaps. */
export function WinnerLetterReels({
  name,
  spinning,
  spinMs = 5000,
  dark = false,
}: {
  name: string
  spinning: boolean
  spinMs?: number
  dark?: boolean
}) {
  const glyphs = Array.from(name)
  let reelIndex = 0

  if (glyphs.length === 0) {
    return (
      <p className={`font-mono font-black tracking-widest text-sm sm:text-base ${dark ? 'text-amber-200/80' : 'text-emerald-700'}`}>
        IDENTIFYING WINNER...
      </p>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap max-w-full px-1">
      {glyphs.map((ch, index) => {
        if (ch === ' ') {
          return <div key={`gap-${index}`} className="w-3 sm:w-5" aria-hidden />
        }
        const thisReel = reelIndex++
        return (
          <LetterReel
            key={`${index}-${ch}`}
            target={ch}
            index={thisReel}
            spinning={spinning}
            spinMs={spinMs}
            dark={dark}
          />
        )
      })}
    </div>
  )
}
