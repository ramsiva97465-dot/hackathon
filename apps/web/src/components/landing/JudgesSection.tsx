import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function JudgesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="judges" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden border-t border-slate-200/60" ref={ref}>
      {/* Background soft ambient waveform lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <svg className="w-full h-full max-w-4xl" viewBox="0 0 800 400" fill="none">
          <path d="M50,200 Q200,100 350,300 T650,200" stroke="#0F172A" strokeWidth="1" />
          <path d="M50,200 Q200,300 350,100 T650,200" stroke="#5B5CEB" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-left space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 uppercase tracking-widest">
            Industry Panel
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tighter leading-[1.08]"
        >
          Evaluated by Pioneers.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 0.95, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-xl md:text-2xl font-bold text-[#475569] leading-relaxed tracking-tight"
        >
          Your work will be evaluated directly by lead research engineers, speech scientists, and product architects from:
          <br /><br />
          <span className="text-[#0F172A] underline decoration-[#5B5CEB] decoration-2 underline-offset-4">Google Cloud</span>,{' '}
          <span className="text-[#0F172A] underline decoration-[#06B6D4] decoration-2 underline-offset-4">ElevenLabs</span>,{' '}
          <span className="text-[#0F172A] underline decoration-[#8B5CF6] decoration-2 underline-offset-4">Sarvam AI</span>,{' '}
          <span className="text-[#0F172A] underline decoration-[#EF4444] decoration-2 underline-offset-4">Vapi.ai</span>,{' '}
          and academic advisors from <span className="text-[#0F172A]">BITS Pilani</span> and <span className="text-[#0F172A]">IIT Madras</span>.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 0.8, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs text-[#475569] leading-relaxed font-light max-w-xl"
        >
          No generic grading sheets. We judge based on conversation latency thresholds, structural integrity of context pipelines, and prompt biometrics validation. Your submissions are scrutinised for direct production capability.
        </motion.p>
      </div>
    </section>
  )
}
export default JudgesSection
