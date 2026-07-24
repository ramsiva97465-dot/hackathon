import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, error, hint, className, id, checked, ...props }, ref) => {
    const switchId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1 w-full">
        <label htmlFor={switchId} className="inline-flex items-start gap-3 cursor-pointer select-none">
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={ref}
              id={switchId}
              type="checkbox"
              className="peer sr-only"
              checked={checked}
              {...props}
            />
            {/* Track container */}
            <div
              className={cn(
                'w-9 h-5 rounded-full border transition-all duration-200',
                'bg-white/10 border-white/5',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50',
                'peer-checked:bg-primary peer-checked:border-primary/50 peer-checked:shadow-[0_0_12px_rgba(79,70,229,0.3)]',
                error && 'border-danger/50 peer-checked:bg-danger peer-checked:border-danger/50',
                className
              )}
            />
            {/* Slider thumb dot */}
            <span
              className={cn(
                'absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 pointer-events-none',
                'peer-checked:translate-x-4'
              )}
            />
          </div>
          {label && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/80 leading-none">{label}</span>
              {hint && !error && <span className="text-xs text-muted mt-1 leading-normal">{hint}</span>}
              {error && <span className="text-xs text-danger mt-1 leading-normal">{error}</span>}
            </div>
          )}
        </label>
      </div>
    )
  }
)

Switch.displayName = 'Switch'
