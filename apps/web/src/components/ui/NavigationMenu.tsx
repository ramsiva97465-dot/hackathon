import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationMenuItemProps {
  trigger: ReactNode
  children: ReactNode
  className?: string
}

export function NavigationMenu({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {children}
    </nav>
  )
}

export function NavigationMenuItem({ trigger, children, className }: NavigationMenuItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted hover:text-white rounded-lg transition-colors duration-150 outline-none',
          isOpen && 'text-white bg-white/5'
        )}
      >
        <span>{trigger}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 mt-2 min-w-[240px] z-50 p-2 rounded-xl border border-white/10 shadow-2xl bg-surface/95 backdrop-blur-xl',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NavigationMenuLink({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-all group"
    >
      {icon && <span className="text-muted group-hover:text-primary transition-colors">{icon}</span>}
      <span className="font-medium">{label}</span>
    </a>
  )
}
