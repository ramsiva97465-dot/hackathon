import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: string | number
  width?: string | number
  rounded?: string
}

export function Skeleton({ height, width, rounded = 'rounded-xl', className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', rounded, className)}
      style={{
        height,
        width,
        ...style,
      }}
      {...props}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="60%" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 bg-surface rounded-xl">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height={14} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
