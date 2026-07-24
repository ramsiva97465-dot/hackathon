import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'accent' | 'secondary' | 'success' | 'danger'
  showLabel?: boolean
  label?: string
  className?: string
  animated?: boolean
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantGradients = {
  primary: 'from-primary to-primary/80',
  accent: 'from-accent to-accent/80',
  secondary: 'from-secondary to-secondary/80',
  success: 'from-success to-success/80',
  danger: 'from-danger to-danger/80',
}

const variantGlow = {
  primary: 'shadow-[0_0_10px_rgba(79,70,229,0.5)]',
  accent: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
  secondary: 'shadow-[0_0_10px_rgba(139,92,246,0.5)]',
  success: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
  danger: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className,
  animated = true,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-muted">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-white">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-white/5 border border-white/5',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            variantGradients[variant],
            variantGlow[variant],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Circular progress
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'primary' | 'accent' | 'secondary' | 'success'
  label?: string
  className?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  variant = 'primary',
  label,
  className,
}: CircularProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const colors = {
    primary: '#4F46E5',
    accent: '#06B6D4',
    secondary: '#8B5CF6',
    success: '#22C55E',
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-semibold text-white">{label}</span>
      )}
    </div>
  )
}
