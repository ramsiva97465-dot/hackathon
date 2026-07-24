import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SectionContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'tight' | 'wide'
}

export function SectionContainer({ size = 'wide', className, children, ...props }: SectionContainerProps) {
  return (
    <div
      className={cn(
        size === 'tight' ? 'container-tight' : 'container-wide',
        'w-full px-4 md:px-6 lg:px-8 py-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
