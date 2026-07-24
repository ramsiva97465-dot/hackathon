import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const SPONSORS_LIST = [
  { name: 'Google Cloud', tier: 'platinum' },
  { name: 'ElevenLabs', tier: 'platinum' },
  { name: 'Vapi.ai', tier: 'gold' },
  { name: 'Supabase', tier: 'gold' },
  { name: 'Vercel', tier: 'gold' },
  { name: 'Anthropic', tier: 'silver' },
  { name: 'Groq', tier: 'silver' },
  { name: 'Sarvam AI', tier: 'silver' },
]

export function Sponsors() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  // Duplicate items to ensure smooth loop gaps
  const items = [...SPONSORS_LIST, ...SPONSORS_LIST, ...SPONSORS_LIST]

  return (
    <section id="sponsors" className="py-20 relative overflow-hidden bg-[#F8FAFC]" ref={ref}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.8 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold mb-8"
        >
          Backed by world-class AI partners
        </motion.p>

        {/* Marquee Track container */}
        <div className="relative w-full flex items-center overflow-hidden py-4 border-y border-slate-200/60">
          {/* Subtle gradient side mask overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
            {items.map((sponsor, i) => (
              <div
                key={i}
                className="font-display font-black text-xl md:text-2xl text-[#94A3B8]/40 hover:text-[#0F172A] transition-colors duration-300 cursor-pointer select-none tracking-tight inline-block"
              >
                {sponsor.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
export default Sponsors
