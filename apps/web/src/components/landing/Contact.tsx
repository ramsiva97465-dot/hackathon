import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Contact() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="contact" className="py-44 md:py-60 relative bg-[#F8FAFC] overflow-hidden border-t border-slate-200/60" ref={ref}>
      {/* Siri style breathing spot glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#5B5CEB]/5 to-[#06B6D4]/5 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-12">
        
        {/* Giant Typographic Closing Statement */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-6xl font-black text-[#0F172A] tracking-tighter leading-[1.04] text-balance"
        >
          The future won't wait.
          <br />
          <span className="gradient-text-primary text-shimmer">Neither should you.</span>
        </motion.h2>

        {/* Big Apple-Style Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <Link to="/apply">
            <button className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-bold text-white bg-[#5B5CEB] hover:bg-[#5B5CEB]/90 transition-all duration-300 shadow-[0_10px_25px_rgba(91,92,235,0.25)] select-none">
              Apply Now
              <ArrowRight size={14} />
            </button>
          </Link>
        </motion.div>

        {/* Minimal Inquiry link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.6 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="pt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest"
        >
          For inquiries: <a href="mailto:hackathon@theaitel.com" className="text-[#0F172A] hover:underline">hackathon@theaitel.com</a>
        </motion.div>

      </div>
    </section>
  )
}
export default Contact
