import { useEffect, useState } from 'react'

const SPIN_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomGlyph() {
  return SPIN_GLYPHS[Math.floor(Math.random() * SPIN_GLYPHS.length)]
}

function LetterReel({
  target,
  index,
  spinning,
}: {
  target: string
  index: number
  spinning: boolean
}) {
  const [glyph, setGlyph] = useState(target)
  const [locked, setLocked] = useState(!spinning)

  useEffect(() => {
    if (!spinning) {
      setGlyph(target)
      setLocked(true)
      return
    }

    setLocked(false)
    const spin = window.setInterval(() => {
      setGlyph(randomGlyph())
    }, 45 + (index % 4) * 12)

    const stop = window.setTimeout(() => {
      window.clearInterval(spin)
      setGlyph(target)
      setLocked(true)
    }, 1100 + index * 160)

    return () => {
      window.clearInterval(spin)
      window.clearTimeout(stop)
    }
  }, [spinning, target, index])

  return (
    <div
      className={`w-7 h-11 sm:w-9 sm:h-14 rounded-lg border flex items-center justify-center font-mono font-black text-lg sm:text-2xl shadow-inner ${
        locked
          ? 'bg-amber-500/15 border-amber-400 text-amber-100'
          : 'bg-black/50 border-amber-700/60 text-amber-200/80'
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
}: {
  name: string
  spinning: boolean
}) {
  const glyphs = Array.from(name)

  if (glyphs.length === 0) {
    return (
      <p className="text-amber-200/80 font-mono font-black tracking-widest text-sm sm:text-base">
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
        return (
          <LetterReel
            key={`${index}-${ch}`}
            target={ch}
            index={index}
            spinning={spinning}
          />
        )
      })}
    </div>
  )
}
