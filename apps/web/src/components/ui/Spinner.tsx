import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin border-t-primary border-r-transparent border-b-transparent border-l-transparent',
        'border-white/10',
        sizes[size],
        className
      )}
      role="status"
      aria-label="loading"
    />
  )
}
