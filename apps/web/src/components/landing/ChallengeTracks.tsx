import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquareCode, Building2, Activity, TrendingUp, Headphones, Sparkles } from 'lucide-react'

interface LocalTrack {
  id: string
  name: string
  description: string
  color: string
  icon: React.ComponentType<any>
  freq: string
  metrics: string[]
}

const LOCAL_TRACKS: LocalTrack[] = [
  {
    id: 'voice-ai',
    name: 'Voice AI Synthesis',
    description: 'Push the limits of neural voice models. Focus on emotion-aware speech synthesizers, organic accents, and zero-shot voice cloning.',
    color: '#5B5CEB',
    icon: Mic,
    freq: '240 Hz',
    metrics: ['Cloning Accuracy', 'Emotion Coherence', 'Natural Intonation'],
  },
  {
    id: 'conversational-ai',
    name: 'Conversational Logic',
    description: 'Optimize interactive voice response pipelines. Handle mid-sentence interruptions, context caching, and sub-300ms round-trip latency.',
    color: '#06B6D4',
    icon: MessageSquareCode,
    freq: '480 Hz',
    metrics: ['Turn-Taking Latency', 'Interruption Handling', 'Semantic Coherence'],
  },
  {
    id: 'enterprise-ai',
    name: 'Enterprise Voice Routing',
    description: 'Deploy agents into complex corporate environments. Connect to live database APIs, automate file writes, and secure sensitive information.',
    color: '#8B5CF6',
    icon: Building2,
    freq: '720 Hz',
    metrics: ['API Integration Speed', 'Database Write Security', 'Prompt Moderation'],
  },
  {
    id: 'healthcare',
    name: 'Clinical Speech triage',
    description: 'Design vocal screening tools for clinical environments. Analyze respiratory rates, support elderly check-ins, and secure medical logs.',
    color: '#22C55E',
    icon: Activity,
    freq: '960 Hz',
    metrics: ['Vocal Diagnostic Parsing', 'HIPAA Log Safety', 'Emergency Escalation'],
  },
  {
    id: 'finance',
    name: 'Secure Conversational Finance',
    description: 'Implement smart voice banking systems. Authenticate users using bio-voiceprints, handle secure portfolio checks, and alert on fraud.',
    color: '#FBBF24',
    icon: TrendingUp,
    freq: '1200 Hz',
    metrics: ['Voiceprint Biometrics', 'Action Verification Speed', 'Fraud Detection Logs'],
  },
  {
    id: 'customer-support',
    name: 'Autonomous Phone Pipelines',
    description: 'Scale outbound call networks using highly optimized, natural-sounding voice agents that resolve user support tickets.',
    color: '#EF4444',
    icon: Headphones,
    freq: '1440 Hz',
    metrics: ['Ticket Resolution Speed', 'Indic Language Support', 'Synthetic Quality Scale'],
  },
]

export function ChallengeTracks() {
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const activeTrack = LOCAL_TRACKS[activeIdx]
  const ActiveIcon = activeTrack.icon

  return (
    <section id="tracks" className="py-32 md:py-44 relative bg-[#F8FAFC] overflow-hidden" ref={ref}>
      {/* Dynamic backdrop orb matching active track color */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-[0.03] transition-all duration-700" 
        style={{ background: activeTrack.color }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#5B5CEB] bg-[#5B5CEB]/10 border border-[#5B5CEB]/20 uppercase tracking-widest">
            Frequencies
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0F172A] mt-4 mb-4 tracking-tighter">
            What You'll Build
          </h2>
          <p className="text-[#475569] text-sm max-w-lg mx-auto font-light leading-relaxed">
            Interact with the audio spectrum below to explore the six engineering categories.
          </p>
        </motion.div>

        {/* ─── Frequency Spectrum Selector ─── */}
        <div className="relative mb-16 max-w-4xl mx-auto">
          {/* Baseline spectrum line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-200" />
          
          {/* Frequency nodes */}
          <div className="flex items-center justify-between relative z-10 px-4 md:px-12">
            {LOCAL_TRACKS.map((track, idx) => {
              const isActive = idx === activeIdx
              return (
                <button
                  key={track.id}
                  onClick={() => setActiveIdx(idx)}
                  className="flex flex-col items-center gap-3 group focus:outline-none"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing glow ring on active */}
                    {isActive && (
                      <span 
                        className="absolute w-7 h-7 rounded-full opacity-25 animate-ping" 
                        style={{ background: track.color }}
                      />
                    )}
                    {/* Solid node circle */}
                    <div 
                      className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-500 ${
                        isActive 
                          ? 'bg-[#0F172A] scale-110 shadow-[0_0_15px_rgba(15,23,42,0.15)]' 
                          : 'bg-[#F8FAFC] border-slate-300 group-hover:border-[#0F172A]'
                      }`}
                      style={{ 
                        borderColor: isActive ? '#0F172A' : undefined,
                        boxShadow: isActive ? `0 0 15px ${track.color}40` : undefined 
                      }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-[#0F172A] font-bold' : 'text-[#94A3B8] group-hover:text-[#0F172A]'
                  }`}>
                    {track.freq}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Spectrum Detail Card (Light Theme) ─── */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200 p-8 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.03)] backdrop-blur-2xl relative overflow-hidden"
            >
              {/* Top accent light */}
              <div 
                className="absolute top-0 inset-x-0 h-[2px] opacity-60 transition-colors duration-500"
                style={{ background: `linear-gradient(to right, transparent, ${activeTrack.color}, transparent)` }}
              />

              <div className="grid md:grid-cols-12 gap-8 items-start">
                {/* Icon Column */}
                <div className="md:col-span-3 flex justify-center md:justify-start">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ background: `${activeTrack.color}10`, border: `1px solid ${activeTrack.color}15` }}
                  >
                    <ActiveIcon size={26} style={{ color: activeTrack.color }} />
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:col-span-9 space-y-5">
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-50 block mb-1">
                      Track Freq // {activeTrack.freq}
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-[#0F172A] tracking-tight">
                      {activeTrack.name}
                    </h3>
                  </div>

                  <p className="text-[#475569] text-xs leading-relaxed font-light">
                    {activeTrack.description}
                  </p>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#06B6D4]" /> Evaluation Parameters
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeTrack.metrics.map((metric) => (
                        <span 
                          key={metric}
                          className="text-[9px] font-bold px-3 py-1 rounded-full bg-slate-50 text-[#475569] border border-slate-200"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
export default ChallengeTracks
