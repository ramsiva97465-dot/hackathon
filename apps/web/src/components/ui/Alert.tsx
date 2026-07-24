import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react'

type AlertType = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: AlertType
  title?: string
  icon?: ReactNode
  onClose?: () => void
}

const typeStyles: Record<AlertType, { container: string; iconClass: string; icon: ReactNode }> = {
  info: {
    container: 'bg-primary/10 border-primary/20 text-white',
    iconClass: 'text-primary',
    icon: <Info size={18} className="text-primary" />,
  },
  success: {
    container: 'bg-success/10 border-success/20 text-white',
    iconClass: 'text-success',
    icon: <CheckCircle2 size={18} className="text-success" />,
  },
  warning: {
    container: 'bg-warning/10 border-warning/20 text-white',
    iconClass: 'text-warning',
    icon: <AlertTriangle size={18} className="text-warning" />,
  },
  danger: {
    container: 'bg-danger/10 border-danger/20 text-white',
    iconClass: 'text-danger',
    icon: <XCircle size={18} className="text-danger" />,
  },
}

export function Alert({
  type = 'info',
  title,
  icon,
  onClose,
  className,
  children,
  ...props
}: AlertProps) {
  const current = typeStyles[type]

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 p-4 rounded-xl border glass-card transition-all duration-200',
        current.container,
        className
      )}
      {...props}
    >
      <span className="shrink-0 mt-0.5">
        {icon || current.icon}
      </span>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold text-sm leading-none tracking-wide text-white">{title}</h5>}
        {children && <div className="text-xs text-muted leading-relaxed">{children}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-muted hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg p-0.5"
          aria-label="Close alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
