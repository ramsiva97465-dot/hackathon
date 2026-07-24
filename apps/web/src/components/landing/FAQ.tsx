import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { FAQ_ITEMS } from '@hackathon/shared'
import { MessageSquare, Sparkles } from 'lucide-react'

export function FAQ() {
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const activeFAQ = FAQ_ITEMS[activeIdx]

  return (
    <section id="faq" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden" ref={ref}>
      {/* Background soft spotlight */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-[#5B5CEB]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Keynote Editorial Header */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 uppercase tracking-widest">
                Questions
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tighter leading-[1.08]"
              style={{ contentVisibility: 'auto' }}
            >
              Questions.
              <br />
              <span className="gradient-text-primary text-shimmer">Answered Clearly.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 0.9, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#475569] text-sm leading-relaxed font-light max-w-sm"
            >
              Have queries about hardware rules, stack requirements, or team parameters? Click the questions on the right to read their transcript responses.
            </motion.p>
          </div>

          {/* Right Column: Interactive Conversation Log */}
          <div className="lg:col-span-7 space-y-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isActive = idx === activeIdx
              return (
                <div key={idx} className="space-y-3">
                  <button
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-all duration-500 ${
                      isActive 
                        ? 'bg-white text-[#0F172A] border-[#5B5CEB]/30 shadow-[0_10px_25px_rgba(91,92,235,0.04)] font-bold' 
                        : 'bg-white/20 text-[#475569] border-slate-200/50 hover:bg-white hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={14} className={isActive ? 'text-[#5B5CEB]' : 'text-slate-400'} />
                      <span className="text-xs font-semibold">{item.question}</span>
                    </div>
                  </button>

                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_15px_40px_rgba(15,23,42,0.02)] overflow-hidden"
                      >
                        <p className="text-xs text-[#475569] leading-relaxed font-light flex items-start gap-2">
                          <Sparkles size={13} className="text-[#06B6D4] shrink-0 mt-0.5" />
                          <span>{item.answer}</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
export default FAQ
