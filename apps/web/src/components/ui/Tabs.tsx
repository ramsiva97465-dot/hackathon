import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TabOption {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabOption[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1',
        variant === 'pill' ? 'bg-surface-2 border border-white/5 p-1 rounded-xl w-fit' : 'border-b border-white/5',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const isDisabled = tab.disabled

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'relative flex items-center gap-2 text-xs font-semibold px-4 py-2.5 transition-all duration-200 outline-none select-none',
              variant === 'underline'
                ? 'text-muted hover:text-white border-b-2 border-transparent pb-3'
                : 'text-muted hover:text-white rounded-lg',
              isActive && (variant === 'underline' ? 'text-white' : 'text-white'),
              isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            {/* Sliding Pill/Underline Indicator */}
            {isActive && (
              <motion.span
                layoutId={`active-tab-${variant}`}
                className={cn(
                  'absolute left-0 right-0 z-0',
                  variant === 'underline' ? 'bottom-[-2px] h-0.5 bg-primary' : 'inset-0 bg-surface-3 border border-white/10 rounded-lg shadow-inner'
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
