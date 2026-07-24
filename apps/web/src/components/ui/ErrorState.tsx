import { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this section. Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        'border border-dashed border-danger/20 rounded-2xl bg-danger/5 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full border border-danger/20 mb-5 bg-danger/10 text-danger shadow-inner">
        <AlertTriangle size={24} />
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
