import { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SuccessState({
  title = 'Success!',
  description = 'The action completed successfully.',
  action,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        'border border-dashed border-success/20 rounded-2xl bg-success/5 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full border border-success/20 mb-5 bg-success/10 text-success shadow-inner">
        <CheckCircle2 size={24} />
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
