import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, leftIcon, containerClassName, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted pointer-events-none z-10">
              {leftIcon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-10 rounded-xl border appearance-none cursor-pointer',
              'bg-surface-3/50 text-white placeholder:text-muted/50',
              'border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
              'px-4 pr-10 text-sm transition-all duration-200',
              'outline-none',
              leftIcon && 'pl-10',
              error && 'border-danger/50 focus:border-danger/70 focus:ring-danger/10',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <span className="absolute right-3 text-muted pointer-events-none z-10">
            <ChevronDown size={16} />
          </span>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
