import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Trophy, Star, Sparkles } from 'lucide-react'

interface LocalPrize {
  rank: number | null
  label: string
  prize: string
  perks: string[]
  glow: string
  border: string
  color: string
}

const PRIZE_DATA: LocalPrize[] = [
  {
    rank: 1,
    label: 'Grand Champion',
    prize: '₹2,00,000',
    perks: ['Direct Internship Offers', 'Cloud Credits $10,000', 'Gold Trophy', 'Certificates'],
    glow: 'rgba(251,191,36,0.04)',
    border: 'rgba(245,158,11,0.25)',
    color: '#F59E0B',
  },
  {
    rank: 2,
    label: 'Second Place',
    prize: '₹1,00,000',
    perks: ['Cloud Credits $5,000', 'Silver Trophy', 'Certificates'],
    glow: 'rgba(148,163,184,0.03)',
    border: 'rgba(148,163,184,0.2)',
    color: '#475569',
  },
  {
    rank: 3,
    label: 'Third Place',
    prize: '₹50,000',
    perks: ['Cloud Credits $2,000', 'Bronze Trophy', 'Certificates'],
    glow: 'rgba(146,64,14,0.03)',
    border: 'rgba(146,64,14,0.2)',
    color: '#B45309',
  },
]

export function PrizePool() {
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const activePrize = PRIZE_DATA[activeIdx]

  return (
    <section id="prizes" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden" ref={ref}>
      {/* Background spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#5B5CEB]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 uppercase tracking-widest">
            What's at Stake
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0F172A] mt-4 mb-4 tracking-tighter">
            What's at Stake.
          </h2>
          <p className="text-[#475569] text-sm max-w-lg mx-auto font-light leading-relaxed">
            ₹5,00,000 total pool. Hover/click the prize ring segments below to expand active perks.
          </p>
        </motion.div>

        {/* ─── Interactive Trophy Spotlight & Orbits ─── */}
        <div className="grid lg:grid-cols-12 gap-16 items-center max-w-5xl mx-auto">
          
          {/* Left: Concentric Orbits */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-[340px] h-[340px] md:w-[400px] md:h-[400px] flex items-center justify-center">
              
              {/* Outer Orbit (3rd Place) */}
              <div 
                className={`absolute inset-0 rounded-full border border-dashed transition-colors duration-500 flex items-start justify-center pt-2.5 cursor-pointer ${
                  activeIdx === 2 ? 'border-[#B45309]/50 animate-pulse-orbit' : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => setActiveIdx(2)}
              >
                <span className={`text-[8px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border ${
                  activeIdx === 2 ? 'bg-[#B45309] text-white border-transparent shadow-sm' : 'bg-[#F8FAFC] text-[#94A3B8] border-slate-200'
                }`}>3rd</span>
              </div>

              {/* Middle Orbit (2nd Place) */}
              <div 
                className={`absolute inset-12 rounded-full border border-dashed transition-colors duration-500 flex items-start justify-center pt-2.5 cursor-pointer ${
                  activeIdx === 1 ? 'border-slate-400/50 animate-pulse-orbit' : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => setActiveIdx(1)}
              >
                <span className={`text-[8px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border ${
                  activeIdx === 1 ? 'bg-[#475569] text-white border-transparent shadow-sm' : 'bg-[#F8FAFC] text-[#94A3B8] border-slate-200'
                }`}>2nd</span>
              </div>

              {/* Inner Orbit (1st Place) */}
              <div 
                className={`absolute inset-24 rounded-full border border-dashed transition-colors duration-500 flex items-start justify-center pt-2.5 cursor-pointer ${
                  activeIdx === 0 ? 'border-[#F59E0B]/50 animate-pulse-orbit' : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => setActiveIdx(0)}
              >
                <span className={`text-[8px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border ${
                  activeIdx === 0 ? 'bg-[#FBBF24] text-black border-transparent shadow-sm' : 'bg-[#F8FAFC] text-[#94A3B8] border-slate-200'
                }`}>1st</span>
              </div>

              {/* Center Spotlight: Trophy Symbol */}
              <div 
                className="absolute inset-36 rounded-full bg-white border flex flex-col items-center justify-center shadow-[0_15px_45px_rgba(15,23,42,0.04)] transition-all duration-500"
                style={{ 
                  borderColor: activePrize.border,
                  boxShadow: `0 10px 30px ${activePrize.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`
                }}
              >
                <Trophy size={36} style={{ color: activePrize.color }} className="animate-pulse" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#94A3B8] uppercase mt-2">Resonance</span>
              </div>

            </div>
          </div>

          {/* Right: Dynamic Info Panel */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200 p-8 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.03)] backdrop-blur-2xl relative overflow-hidden"
            >
              {/* Highlight bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-500"
                style={{ background: activePrize.color }}
              />

              <span className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-50 block mb-1">
                Reward Tier
              </span>
              <h3 className="font-display font-extrabold text-xl text-[#0F172A] tracking-tight mb-2">
                {activePrize.label}
              </h3>
              
              <div className="font-display text-4xl font-extrabold tracking-tight mb-6" style={{ color: activePrize.color }}>
                {activePrize.prize}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[#06B6D4]" /> Active perks included
                </h4>
                <ul className="space-y-3">
                  {activePrize.perks.map((perk) => (
                    <li key={perk} className="text-xs text-[#475569] flex items-center gap-2.5 font-light">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: activePrize.color }} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
export default PrizePool
