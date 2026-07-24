import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, hint, className, id, checked, ...props }, ref) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1 w-full">
        <label htmlFor={checkboxId} className="inline-flex items-start gap-2.5 cursor-pointer select-none">
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className="peer sr-only"
              checked={checked}
              {...props}
            />
            {/* Box visual */}
            <div
              className={cn(
                'w-5 h-5 rounded-lg border transition-all duration-150',
                'bg-surface-3/50 border-white/10',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50',
                'peer-checked:bg-primary peer-checked:border-primary peer-checked:shadow-[0_0_12px_rgba(79,70,229,0.3)]',
                error && 'border-danger/50 peer-checked:bg-danger peer-checked:border-danger',
                className
              )}
            />
            {/* Icon checkmark */}
            <Check
              size={12}
              className="absolute text-white stroke-[3.5px] scale-0 peer-checked:scale-100 transition-transform duration-150 pointer-events-none"
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

Checkbox.displayName = 'Checkbox'
