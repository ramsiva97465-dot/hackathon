import { HTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChipVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'accent'

interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  variant?: ChipVariant
  icon?: ReactNode
  onDismiss?: () => void
}

const variantStyles: Record<ChipVariant, string> = {
  default: 'bg-white/10 text-white border-white/15',
  primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  danger: 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  accent: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
}

export function Chip({
  variant = 'default',
  icon,
  onDismiss,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold select-none transition-all duration-150',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="shrink-0 rounded-full hover:bg-white/10 text-current transition-colors duration-150 outline-none p-0.5"
          aria-label="Remove filter"
        >
          <X size={10} className="stroke-[3px]" />
        </button>
      )}
    </span>
  )
}
