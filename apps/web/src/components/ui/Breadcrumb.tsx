import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  className?: string
}

export function Breadcrumb({ items, separator = <ChevronRight size={14} />, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-muted', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center">
          <Link
            to="/"
            className="hover:text-white transition-colors duration-150 flex items-center p-0.5"
            aria-label="Home"
          >
            <Home size={14} />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center gap-1.5">
              <span className="text-muted/40 shrink-0 pointer-events-none select-none">
                {separator}
              </span>
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="hover:text-white transition-colors duration-150 font-medium whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium whitespace-nowrap truncate max-w-[150px]',
                    isLast ? 'text-white' : 'text-muted'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
