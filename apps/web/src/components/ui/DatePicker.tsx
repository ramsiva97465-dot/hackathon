import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, hint, containerClassName, className, id, ...props }, ref) => {
    const pickerId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={pickerId} className="text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-muted pointer-events-none z-10">
            <Calendar size={18} />
          </span>
          <input
            ref={ref}
            id={pickerId}
            type="date"
            className={cn(
              'w-full h-10 rounded-xl border px-10 text-sm appearance-none outline-none transition-all duration-200',
              'bg-surface-3/50 text-white placeholder:text-muted/50 border-white/10',
              'focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
              'scheme-dark', // standard browser support for dark layout inputs
              error && 'border-danger/50 focus:border-danger/70 focus:ring-danger/10',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
