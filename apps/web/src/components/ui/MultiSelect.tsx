import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  error,
  hint,
  containerClassName,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelect = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((item) => item !== val))
    } else {
      onChange([...value, val])
    }
  }

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((item) => item !== val))
  }

  const selectedLabels = options.filter((o) => value.includes(o.value))

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5 w-full relative', containerClassName)}>
      {label && (
        <span className="text-sm font-medium text-white/80">
          {label}
        </span>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'min-h-[40px] w-full rounded-xl border flex items-center justify-between gap-2 p-2 cursor-pointer transition-all duration-200 select-none',
          'bg-surface-3/50 border-white/10 text-white text-sm',
          isOpen && 'border-primary/50 ring-2 ring-primary/10',
          error && 'border-danger/50 focus-within:ring-danger/10'
        )}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedLabels.length === 0 ? (
            <span className="text-muted/50 px-2">{placeholder}</span>
          ) : (
            selectedLabels.map((item) => (
              <span
                key={item.value}
                className="inline-flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-lg text-xs font-medium"
              >
                {item.label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(item.value, e)}
                  className="hover:text-white transition-colors duration-150 rounded"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className="text-muted shrink-0 mr-1" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto z-50 p-1.5 rounded-xl border border-white/10 shadow-2xl bg-surface/95 backdrop-blur-xl"
          >
            {options.map((option) => {
              const isChecked = value.includes(option.value)
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-150',
                    'text-muted hover:text-white hover:bg-white/5',
                    isChecked && 'text-white bg-primary/10 border border-primary/20'
                  )}
                >
                  <span>{option.label}</span>
                  {isChecked && <Check size={14} className="text-primary stroke-[2.5px]" />}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
