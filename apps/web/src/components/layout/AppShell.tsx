import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background text-white antialiased selection:bg-primary/30 selection:text-white',
        'flex flex-col relative overflow-x-hidden font-sans',
        className
      )}
    >
      {/* Global Focus Indicators styling via styles */}
      <style>{`
        *:focus-visible {
          outline: 2px solid #4F46E5 !important;
          outline-offset: 2px !important;
        }
      `}</style>

      {children}
    </div>
  )
}
