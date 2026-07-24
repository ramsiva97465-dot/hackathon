import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function About() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden" ref={ref}>
      {/* Soft echo waves in the background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div className="w-[600px] h-[600px] border border-[#0F172A] rounded-full animate-[ping_8s_infinite]" />
        <div className="w-[400px] h-[400px] border border-[#0F172A] rounded-full absolute animate-[ping_6s_infinite]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-left space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 uppercase tracking-widest">
            The Manifesto
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 0.95, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-2xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-[1.25] text-balance"
        >
          Voice is the most natural interface humans have ever created. For decades, we compromised, translating our thoughts into keyboards, buttons, and pixels. 
          <br /><br />
          That compromise is over. We are launching the future of conversational speech intelligence.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 0.8, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs text-[#475569] leading-relaxed font-light max-w-lg text-balance"
        >
          The AI Voice Agent Hackathon is a national challenge gathering builders to construct latency-optimized, emotionally aware voice systems. We are not here to build toys; we are here to construct interfaces that speak like humans.
        </motion.p>
      </div>
    </section>
  )
}
export default About
