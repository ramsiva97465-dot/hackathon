import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SnapServeMark, VobizMark } from '@/components/brand/BrandLogos'
import { Avatar } from '@/components/ui/Avatar'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'
import type { LeaderboardEntry } from '@hackathon/shared'

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: '1', teamName: 'SpeakSense',    college: 'BITS Pilani',    track: 'REAL_WORLD_DEPLOYMENT', totalScore: 91.2, judgeCount: 6, previousRank: 2, scores: [] },
  { rank: 2, teamId: '2', teamName: 'AudioMind',     college: 'VIT Chennai',    track: 'VOICE_AI_AGENT',        totalScore: 88.7, judgeCount: 5, previousRank: 1, scores: [] },
  { rank: 3, teamId: '3', teamName: 'NovaTalk',      college: 'NIT Trichy',     track: 'MULTIMODAL_AI',         totalScore: 84.5, judgeCount: 5, previousRank: 3, scores: [] },
  { rank: 4, teamId: '4', teamName: 'VoiceForge AI', college: 'IIT Madras',     track: 'VOICE_AI_AGENT',        totalScore: 81.0, judgeCount: 4, previousRank: 5, scores: [] },
  { rank: 5, teamId: '5', teamName: 'EchoBot Labs',  college: 'SRM University', track: 'MULTIMODAL_AI',         totalScore: 79.3, judgeCount: 4, previousRank: 4, scores: [] },
  { rank: 6, teamId: '6', teamName: 'DeepVoice',     college: 'SASTRA',         track: 'VOICE_AI_AGENT',        totalScore: 75.8, judgeCount: 3, previousRank: 6, scores: [] },
  { rank: 7, teamId: '7', teamName: 'TalkFlow',      college: 'Amrita',         track: 'REAL_WORLD_DEPLOYMENT', totalScore: 72.1, judgeCount: 3, previousRank: 8, scores: [] },
  { rank: 8, teamId: '8', teamName: 'MindSpeak',     college: 'SSN Engineering',track: 'MULTIMODAL_AI',         totalScore: 68.4, judgeCount: 2, previousRank: 7, scores: [] },
]

function Delta({ curr, prev }: { curr: number; prev?: number }) {
  if (!prev || curr === prev) return <Minus size={14} className="text-slate-400" />
  if (curr < prev) return <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold"><TrendingUp size={14} />{prev - curr}</div>
  return <div className="flex items-center gap-1 text-red-500 text-sm font-bold"><TrendingDown size={14} />{curr - prev}</div>
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [clock, setClock] = useState(new Date())
  const [activeRound, setActiveRound] = useState<number>(1)

  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
  })
  
  useEffect(() => { emit('leaderboard:subscribe') }, [emit])
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])

  const rawDisplay = entries.length > 0 ? entries : mockLeaderboard

  // Filter based on active round
  const filtered = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
      return true
    })
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  const top3 = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  // Reorder podium to be 2nd, 1st, 3rd visually
  const podiumOrder = [
    top3.find(e => e.rank === 2),
    top3.find(e => e.rank === 1),
    top3.find(e => e.rank === 3),
  ]

  return (
    <div className="min-h-screen flex flex-col relative" style={{
      backgroundColor: '#EBE3D5', // Exact beige color requested
      backgroundImage: 'radial-gradient(#d4caba 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    }}>
      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-black/5 bg-[#EBE3D5]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <SnapServeMark className="h-8 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">snapserve.ai</span>
          </div>
          <span className="text-black/10 text-2xl font-light">|</span>
          <div className="flex items-center gap-2">
            <VobizMark className="h-6 w-8 drop-shadow-sm text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-bold text-lg tracking-tight">vobiz.ai</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-orange-600 tracking-widest uppercase">Live Updates</span>
          </div>
          <span className="text-slate-500 font-mono text-xl font-bold tracking-wider">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-10 pb-20 px-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-slate-700 mb-4 shadow-xl shadow-black/5">
             <Trophy size={14} className="text-amber-500" />
             <span className="text-xs font-bold uppercase tracking-widest">
               {activeRound === 3 ? 'Stage 3: Winners podium' : activeRound === 2 ? 'Stage 2: Top 20 Shortlist' : 'Stage 1: All Teams'}
             </span>
          </div>
          <h2 className="text-[#E83C00] font-bold tracking-[0.2em] uppercase text-sm mb-3">
            AI Voice Hackathon 2026
          </h2>
          <h1 className="text-7xl font-black text-[#1A1A1A] tracking-tighter" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            {activeRound === 3 ? 'Final Winners' : activeRound === 2 ? 'Round 2 Qualified' : 'Live Scoreboard'}
          </h1>
        </div>

        {/* Round Tab Selector */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-2 mb-12 shadow-inner border border-black/5">
          <button
            onClick={() => setActiveRound(1)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 1 ? 'bg-white text-[#E83C00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Round 1 (All)
          </button>
          <button
            onClick={() => setActiveRound(2)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 2 ? 'bg-white text-[#E83C00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Round 2 (Top 20)
          </button>
          <button
            onClick={() => setActiveRound(3)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 3 ? 'bg-white text-[#E83C00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Winners (Top 3)
          </button>
        </div>

        {/* ── Podium (Top 3) ── */}
        <div className="flex items-end justify-center gap-6 mb-16 w-full max-w-5xl">
          {podiumOrder.map((entry, idx) => {
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            const heights = { 1: 'h-[340px]', 2: 'h-[280px]', 3: 'h-[240px]' };
            
            // Editorial vibrant colors for the cards
            const cardStyles = {
              1: { bg: '#F4ECE1', border: '#E83C00', text: '#1A1A1A', badge: 'bg-[#E83C00] text-white', shadow: 'shadow-2xl shadow-orange-900/10' },
              2: { bg: '#F4ECE1', border: 'transparent', text: '#475569', badge: 'bg-[#EAE4D8] text-slate-700', shadow: 'shadow-xl shadow-black/5' },
              3: { bg: '#F4ECE1', border: 'transparent', text: '#78350F', badge: 'bg-amber-100/60 text-amber-900', shadow: 'shadow-xl shadow-black/5' },
            };
            const style = cardStyles[entry.rank as keyof typeof cardStyles];

            return (
              <motion.div
                key={entry.teamId}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6, type: 'spring', bounce: 0.4 }}
                className={`relative flex flex-col items-center p-8 rounded-[2rem] w-1/3 ${heights[entry.rank as keyof typeof heights]} ${style.shadow}`}
                style={{
                  backgroundColor: style.bg,
                  border: `2px solid ${style.border}`,
                }}
              >
                {/* Rank Badge */}
                <div className={`absolute -top-6 px-5 py-2.5 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${style.badge}`}>
                  {isFirst ? <span className="flex items-center gap-2"><Trophy size={20} /> 1st Place</span> : `#${entry.rank}`}
                </div>

                <div className="mt-8 flex flex-col items-center text-center flex-1 w-full">
                  <Avatar name={entry.teamName} size="lg" className={`mb-4 shadow-md ring-4 ${isFirst ? 'ring-orange-100' : 'ring-white/50'}`} />
                  <h3 className="text-3xl font-black text-[#1A1A1A] mb-1 truncate w-full">{entry.teamName}</h3>
                  <p className="text-slate-500 font-medium text-sm truncate w-full">{entry.college}</p>
                </div>

                <div className="w-full pt-6 mt-auto border-t border-black/5 text-center">
                  <motion.div
                    key={entry.totalScore}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-black tracking-tight"
                    style={{ color: style.text }}
                  >
                    {entry.totalScore.toFixed(1)}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Table (Rank 4+) ── */}
        <div className="w-full max-w-5xl rounded-[2rem] bg-[#F4ECE1] shadow-2xl shadow-black/10 overflow-hidden border border-black/5">
          <div className="grid grid-cols-[80px_1fr_200px_120px_120px_80px] px-8 py-5 bg-[#EBE2D5] border-b border-black/5 text-xs font-bold text-slate-600 uppercase tracking-widest">
            <div className="text-center">Rank</div>
            <div>Team Details</div>
            <div>Track</div>
            <div className="text-center">Judges</div>
            <div className="text-right">Score</div>
            <div className="text-right">Change</div>
          </div>
          
          <div className="flex flex-col bg-[#F4ECE1]">
            <AnimatePresence>
              {rest.map((entry, idx) => {
                const track = getTrackConfig(entry.track)
                return (
                  <motion.div
                    key={entry.teamId}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="grid grid-cols-[80px_1fr_200px_120px_120px_80px] px-8 py-5 items-center border-b border-black/5 hover:bg-white/50 transition-colors"
                  >
                    <div className="text-xl font-black text-slate-400 text-center">
                      {entry.rank}
                    </div>
                    
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar name={entry.teamName} size="md" className="shadow-sm ring-2 ring-white" />
                      <div className="min-w-0">
                        <div className="text-lg font-bold text-slate-900 truncate">{entry.teamName}</div>
                        <div className="text-sm font-medium text-slate-500 truncate">{entry.college}</div>
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm bg-white"
                        style={{ color: track.color, borderColor: `${track.color}40` }}>
                        {track.label}
                      </span>
                    </div>

                    <div className="text-center text-slate-500 font-mono font-semibold">
                      {entry.judgeCount} / 6
                    </div>

                    <div className="text-right text-2xl font-black text-slate-900">
                      {entry.totalScore.toFixed(1)}
                    </div>

                    <div className="flex justify-end">
                      <Delta curr={entry.rank} prev={entry.previousRank} />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LeaderboardPage
