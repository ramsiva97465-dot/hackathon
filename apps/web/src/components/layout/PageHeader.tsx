import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumbs, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 pb-6 border-b border-white/5 mb-8 md:flex-row md:items-end md:justify-between md:gap-4', className)}>
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="mb-2">
            {breadcrumbs}
          </div>
        )}
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-3 mt-4 md:mt-0">
          {action}
        </div>
      )}
    </div>
  )
}
