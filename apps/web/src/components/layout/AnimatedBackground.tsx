import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FloatingGradientOrbs } from '@/components/ui/FloatingGradientOrbs'

export function AnimatedBackground({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative min-h-screen w-full overflow-hidden bg-background hero-bg z-0',
        className
      )}
      {...props}
    >
      {/* Background Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-45" />

      {/* Floating Interactive Ambient Orbs */}
      <FloatingGradientOrbs />

      {/* Actual Content Layout layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
