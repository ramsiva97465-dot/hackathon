import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section 
      ref={ref}
      className="relative flex flex-col justify-center items-center min-h-[90vh] py-36 md:py-48 overflow-hidden bg-[#F8FAFC]"
    >
      {/* Siri style soft ambient glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#5B5CEB]/10 to-[#06B6D4]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative breathing voice line in background */}
      <div className="absolute bottom-12 left-0 right-0 h-24 flex items-center justify-center pointer-events-none opacity-40">
        <svg className="w-full max-w-lg h-full" viewBox="0 0 400 100" fill="none">
          <path d="M0,50 Q100,50 150,50 T200,50 T250,50 T300,50 T400,50" stroke="#E2E8F0" strokeWidth="1" />
          <path d="M0,50 Q100,20 150,80 T200,20 T250,50 T300,50 T400,50" stroke="url(#siri-gradient)" strokeWidth="1.5" className="animate-[pulse_4s_infinite]" />
          <defs>
            <linearGradient id="siri-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5B5CEB" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
        
        {/* Spark label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/5 border border-[#5B5CEB]/15 uppercase tracking-widest">
            <Sparkles size={10} className="text-[#06B6D4]" />
            National Hackathon Challenge
          </div>
        </motion.div>

        {/* Giant Editorial Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl md:text-7xl font-black text-[#0F172A] tracking-tighter leading-[0.98] select-none"
        >
          The Next Era of
          <br />
          <span className="gradient-text-primary text-shimmer">Voice Intelligence.</span>
        </motion.h1>

        {/* Stark Editorial Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 0.85, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[#475569] text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed"
        >
          Build conversation agents that understand intent, handle context, and speak in real frequencies. 48 hours to design the voice-first future.
        </motion.p>

        {/* Clean Call To Action Trigger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center pt-4"
        >
          <Link to="/">
            <button className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-xs font-bold text-white bg-[#5B5CEB] hover:bg-[#5B5CEB]/90 transition-all duration-300 shadow-[0_10px_25px_rgba(91,92,235,0.25)] select-none">
              Apply to Accelerate
              <ArrowRight size={14} />
            </button>
          </Link>
        </motion.div>

      </div>
    </section>
  )
}
export default Hero
