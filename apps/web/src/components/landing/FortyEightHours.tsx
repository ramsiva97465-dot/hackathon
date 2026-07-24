import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface MomentProps {
  time: string
  title: string
  description: string
  delay: number
}

function Moment({ time, title, description, delay }: MomentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="grid md:grid-cols-12 gap-6 items-start py-12 md:py-20 border-b border-slate-200/60"
    >
      <div className="md:col-span-3">
        <span className="font-mono text-3xl md:text-4xl font-extrabold text-[#5B5CEB]">{time}</span>
      </div>
      <div className="md:col-span-9 space-y-3">
        <h3 className="font-display text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight">{title}</h3>
        <p className="text-xs text-[#475569] leading-relaxed font-light max-w-xl">{description}</p>
      </div>
    </motion.div>
  )
}

export function FortyEightHours() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="forty-eight-hours" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden border-t border-slate-200/60" ref={ref}>
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="space-y-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 uppercase tracking-widest">
              The Journey
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tighter leading-[1.08] max-w-xl"
          >
            48 Hours.
            <br />
            From <span className="gradient-text-primary text-shimmer">Silence to Speech.</span>
          </motion.h2>
        </div>

        {/* Story Elements */}
        <div className="divide-y divide-slate-200/60 border-t border-slate-200/60">
          <Moment
            time="00:00"
            title="The Whisper"
            description="The spark of coordination. Formulate your team profile, synthesize the parameters of the tracks, and lock in the core concept. Silence transitions to structure."
            delay={0.1}
          />
          <Moment
            time="24:00"
            title="The Echo"
            description="Halfway through the cycle. The logic loops are established. Voice-to-text systems, LLM parameters, and speech synthesis chains start aligning. The platform begins to answer."
            delay={0.2}
          />
          <Moment
            time="48:00"
            title="The Synthesis"
            description="The final countdown. Optimize API latencies, refine voice nuances, and deploy the working agent. The final transmission is uploaded. The future speaks in real frequencies."
            delay={0.3}
          />
        </div>

      </div>
    </section>
  )
}
export default FortyEightHours
