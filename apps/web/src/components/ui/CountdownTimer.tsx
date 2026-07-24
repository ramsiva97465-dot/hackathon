import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetDate: string | Date
  className?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date()
      let timeRemaining: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 }

      if (difference > 0) {
        timeRemaining = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      }

      setTimeLeft(timeRemaining)
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const timeBlocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ]

  return (
    <div className={cn('flex items-center gap-4 justify-center md:gap-6', className)}>
      {timeBlocks.map((block, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center font-display text-2xl font-bold border border-white/10 relative overflow-hidden',
              'bg-surface-3/30 backdrop-blur-md shadow-2xl text-white md:w-20 md:h-20 md:text-3xl'
            )}
          >
            {/* Subtle inner top-edge shine */}
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="font-mono">{String(block.value).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted mt-2 font-bold select-none">{block.label}</span>
        </div>
      ))}
    </div>
  )
}
