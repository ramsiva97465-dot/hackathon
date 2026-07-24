import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TimelineItem {
  date: string
  time: string
  title: string
  description?: string
  icon?: ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative border-l border-white/5 pl-8 ml-3 space-y-10', className)}>
      {/* Decorative vertical gradient shadow line */}
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#6366F1]/20 via-[#22D3EE]/20 to-transparent pointer-events-none" />

      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          {/* Pulsing timeline bullet dot */}
          <span
            className={cn(
              'absolute left-0 -translate-x-[38px] top-1.5 w-4 h-4 rounded-full border border-white/10 bg-[#0B1220] transition-all duration-500',
              'group-hover:border-[#22D3EE] group-hover:bg-[#22D3EE]/20 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]'
            )}
          >
            {/* Center core pulse */}
            <span className="absolute inset-1 rounded-full bg-white/20 group-hover:bg-[#22D3EE] transition-colors duration-300" />
          </span>
          
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-8">
            {/* Timestamp date column */}
            <div className="shrink-0 w-28 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <span className="text-[11px] font-bold text-[#6366F1] block leading-none uppercase tracking-wider">{item.date}</span>
              <span className="text-[10px] text-[#94A3B8] block mt-1 font-mono font-medium">{item.time}</span>
            </div>

            {/* Content card */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                {item.icon && <span className="text-[#94A3B8] shrink-0">{item.icon}</span>}
                <h4 className="font-display font-bold text-sm text-white tracking-wide group-hover:text-[#22D3EE] transition-colors duration-300">
                  {item.title}
                </h4>
              </div>
              {item.description && (
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl font-light">{item.description}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
