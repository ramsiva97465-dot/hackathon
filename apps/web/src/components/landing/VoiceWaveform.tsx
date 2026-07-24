import { memo } from 'react'

interface VoiceWaveformProps {
  bars?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  color?: 'primary' | 'accent' | 'gradient'
}

const barCounts = { sm: 12, md: 20, lg: 32 }
const barHeights = { sm: 24, md: 40, lg: 64 }

export const VoiceWaveform = memo(function VoiceWaveform({
  bars,
  className = '',
  size = 'md',
  animated = true,
  color = 'gradient',
}: VoiceWaveformProps) {
  const count = bars ?? barCounts[size]
  const maxH = barHeights[size]

  const heights = Array.from({ length: count }, (_, i) => {
    // Natural waveform shape: taller in middle, shorter at edges
    const pos = i / (count - 1)
    const wave = Math.sin(pos * Math.PI) * 0.7 + 0.3
    const noise = Math.sin(i * 2.3) * 0.15 + Math.cos(i * 1.7) * 0.1
    return Math.max(0.15, Math.min(1, wave + noise))
  })

  const getBarStyle = (index: number, height: number) => {
    const delay = (index / count) * 1.5
    const duration = 0.8 + (Math.sin(index * 1.3) + 1) * 0.4
    return {
      height: `${height * maxH}px`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }
  }

  const barColor =
    color === 'gradient'
      ? 'bg-gradient-to-t from-primary to-accent'
      : color === 'accent'
      ? 'bg-accent'
      : 'bg-primary'

  return (
    <div
      className={`flex items-end gap-[3px] ${className}`}
      aria-label="Voice waveform visualization"
      role="img"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${barColor} ${animated ? 'animate-waveform' : ''}`}
          style={animated ? getBarStyle(i, h) : { height: `${h * maxH}px` }}
        />
      ))}
    </div>
  )
})
