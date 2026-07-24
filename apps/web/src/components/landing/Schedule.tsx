import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CalendarRange, Sparkles } from 'lucide-react'

interface ScheduleDay {
  day: string
  label: string
  date: string
  items: {
    time: string
    title: string
    description: string
  }[]
}

const SCHEDULE_DAYS: ScheduleDay[] = [
  {
    day: 'Day 1',
    label: 'Launch & Hacking',
    date: 'Aug 15',
    items: [
      { time: '09:00 AM', title: 'Opening Ceremony', description: 'Welcome addresses, platform launch details, and APIs keys reveal.' },
      { time: '11:00 AM', title: 'Hacking Begins', description: 'Workspace gates open. 50 teams begin coding and optimizing pipelines.' },
      { time: '01:00 PM', title: 'Lunch + Mentor Sessions', description: 'Network and query direct engineering feedback from voice AI sponsors.' },
    ],
  },
  {
    day: 'Day 2',
    label: 'Refining & Submissions',
    date: 'Aug 16',
    items: [
      { time: '10:00 AM', title: 'Mid-Point Check-in', description: 'Progress loops review, office hours, and technical checkpoint reviews.' },
      { time: '05:00 PM', title: 'Submission Deadline', description: 'Final code repository freeze and demo video uploads close.' },
    ],
  },
  {
    day: 'Day 3',
    label: 'Demos & Ceremony',
    date: 'Aug 17',
    items: [
      { time: '10:00 AM', title: 'Round 1 — Demos', description: 'Simultaneous panel presentations to speech scientist judges.' },
      { time: '02:00 PM', title: 'Round 2 — Finals', description: 'Top 5 projects pitch live on the main stage to the general assembly.' },
      { time: '05:00 PM', title: 'Awards Ceremony', description: 'Announcement of winners, certificates distribution, and closing keynotes.' },
    ],
  },
]

export function Schedule() {
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const activeDay = SCHEDULE_DAYS[activeDayIdx]

  return (
    <section 
      id="schedule" 
      className="dark-section py-32 md:py-44 relative bg-[#030712] overflow-hidden" 
      ref={ref}
    >
      {/* Background spot glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-[#6366F1]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 grid-mesh opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Keynote Title */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 uppercase tracking-widest">
                The Journey
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-[1.08]"
            >
              The Journey.
              <br />
              <span className="gradient-text-primary text-shimmer">Every Milestones Defined</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 0.9, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#CBD5E1] text-sm leading-relaxed font-light max-w-sm"
            >
              Every segment is calculated. Navigate the Day Select selectors on the right to review active timelines, submission caps, and evaluation rounds.
            </motion.p>

            {/* Day Selector Capsule List */}
            <div className="flex flex-col gap-2.5 pt-4">
              {SCHEDULE_DAYS.map((dayItem, idx) => {
                const isActive = idx === activeDayIdx
                return (
                  <button
                    key={dayItem.day}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-all duration-500 ${
                      isActive 
                        ? 'bg-[#0B1220]/60 text-white border-[#6366F1]/30 shadow-[0_10px_25px_rgba(99,102,241,0.06)]' 
                        : 'bg-white/[0.01] text-[#94A3B8] border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarRange size={16} className={isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8]'} />
                      <div>
                        <span className="text-[10px] font-mono tracking-wider block opacity-60 uppercase">{dayItem.day}</span>
                        <span className="text-xs font-bold block mt-0.5">{dayItem.label}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold">{dayItem.date}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Time Blocks Grid */}
          <div className="lg:col-span-7 relative">
            {/* Top divider */}
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-white/5" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDayIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 pt-6"
              >
                {activeDay.items.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex gap-6 items-start pb-6 border-b border-white/5 last:border-b-0 group"
                  >
                    {/* Timestamp column */}
                    <div className="shrink-0 w-24 bg-[#0B1220] border border-white/5 px-2.5 py-1.5 rounded-lg text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <span className="text-[10px] font-mono font-bold text-[#22D3EE] tracking-wide block">{item.time}</span>
                    </div>

                    {/* Content Column */}
                    <div className="space-y-1.5 flex-1">
                      <motion.h4 className="font-display font-bold text-sm text-white group-hover:text-[#6366F1] transition-colors duration-300 flex items-center gap-1.5">
                        <Sparkles size={11} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#6366F1]" /> {item.title}
                      </motion.h4>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed font-light">{item.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Schedule
