import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        'border border-dashed border-white/10 rounded-2xl bg-surface/30 backdrop-blur-sm',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full border border-white/10 mb-5',
          'bg-surface-3/50 text-muted shadow-inner'
        )}
      >
        {icon}
      </div>
      <h4 className="font-display font-bold text-lg text-white mb-2 tracking-wide">
        {title}
      </h4>
      <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  )
}
