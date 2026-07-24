import { useState, useEffect, useRef } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function useCountdown(targetDate: string | Date): TimeLeft {
  const target = new Date(targetDate).getTime()

  const calculate = (): TimeLeft => {
    const now = Date.now()
    const total = Math.max(0, target - now)
    return {
      total,
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / 1000 / 60) % 60),
      seconds: Math.floor((total / 1000) % 60),
    }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculate)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(calculate())
    }, 1000)
    return () => window.clearInterval(intervalRef.current)
  }, [target])

  return timeLeft
}
