import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { VoiceWaveform } from '@/components/landing/VoiceWaveform'
import { leaderboardRowVariants } from '@/lib/motion'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Crown, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { LeaderboardEntry } from '@hackathon/shared'

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: '1', teamName: 'SpeakSense', college: 'BITS Pilani', track: 'REAL_WORLD_DEPLOYMENT', totalScore: 91.2, judgeCount: 3, previousRank: 2, scores: [] },
  { rank: 2, teamId: '2', teamName: 'AudioMind', college: 'VIT Chennai', track: 'VOICE_AI_AGENT', totalScore: 88.7, judgeCount: 3, previousRank: 1, scores: [] },
  { rank: 3, teamId: '3', teamName: 'NovaTalk', college: 'NIT Trichy', track: 'MULTIMODAL_AI', totalScore: 84.5, judgeCount: 2, previousRank: 3, scores: [] },
  { rank: 4, teamId: '4', teamName: 'VoiceForge AI', college: 'IIT Madras', track: 'VOICE_AI_AGENT', totalScore: 81.0, judgeCount: 2, previousRank: 5, scores: [] },
  { rank: 5, teamId: '5', teamName: 'EchoBot Labs', college: 'SRM University', track: 'MULTIMODAL_AI', totalScore: 79.3, judgeCount: 3, previousRank: 4, scores: [] },
  { rank: 6, teamId: '6', teamName: 'DeepVoice', college: 'SASTRA', track: 'VOICE_AI_AGENT', totalScore: 75.8, judgeCount: 2, previousRank: 6, scores: [] },
  { rank: 7, teamId: '7', teamName: 'TalkFlow', college: 'Amrita', track: 'REAL_WORLD_DEPLOYMENT', totalScore: 72.1, judgeCount: 3, previousRank: 8, scores: [] },
  { rank: 8, teamId: '8', teamName: 'MindSpeak', college: 'SSN Engineering', track: 'MULTIMODAL_AI', totalScore: 68.4, judgeCount: 1, previousRank: 7, scores: [] },
]

function RankIndicator({ curr, prev }: { curr: number; prev?: number }) {
  if (!prev || curr === prev) return <Minus size={13} className="text-[#94A3B8]" />
  if (curr < prev) return <div className="flex items-center gap-0.5 text-[#10B981] text-xs font-bold"><TrendingUp size={13} />{prev - curr}</div>
  return <div className="flex items-center gap-0.5 text-[#EF4444] text-xs font-bold"><TrendingDown size={13} />{curr - prev}</div>
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FBBF24] to-[#F59E0B] shadow-[0_4px_10px_rgba(245,158,11,0.2)] border border-[#FBBF24]/30">
      <Crown size={16} className="text-black" />
    </div>
  )
  if (rank === 2) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#94A3B8] to-[#CBD5E1] border border-[#CBD5E1]/30">
      <Medal size={16} className="text-black" />
    </div>
  )
  if (rank === 3) return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#92400E] to-[#B45309] border border-[#B45309]/30">
      <Medal size={16} className="text-white" />
    </div>
  )
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200">
      <span className="font-mono font-bold text-xs text-[#94A3B8]">#{rank}</span>
    </div>
  )
}

const radarData = [
  { criterion: 'Innovation', value: 92 },
  { criterion: 'Technical Complexity', value: 88 },
  { criterion: 'UI/UX Craft', value: 95 },
  { criterion: 'Business Viability', value: 85 },
  { criterion: 'Presentation', value: 90 },
]

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(mockLeaderboard)
  const [filter, setFilter] = useState<'ALL' | 'VOICE_AI_AGENT' | 'MULTIMODAL_AI' | 'REAL_WORLD_DEPLOYMENT'>('ALL')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Real-time updates via WebSocket
  useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
    setLastUpdate(new Date())
  })

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.track === filter)

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden text-[#0F172A]">
      {/* Background soft orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#5B5CEB]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#06B6D4]/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto relative z-10">
        {/* Hero title block */}
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/20 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-widest">Live standings</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold text-[#0F172A] mb-4 tracking-tighter">
            Live <span className="gradient-text-primary text-shimmer">Rankings</span>
          </h1>
          <p className="text-[#475569] text-sm leading-relaxed font-light">
            Real-time standings compiled instantly as panel judges evaluate team submissions.
          </p>
          <p className="text-[10px] text-[#94A3B8] font-mono mt-3 uppercase tracking-wider">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="space-y-10">
          {/* Filters */}
          <div className="flex justify-center gap-2 flex-wrap">
            {(['ALL', 'VOICE_AI_AGENT', 'MULTIMODAL_AI', 'REAL_WORLD_DEPLOYMENT'] as const).map(f => {
              const label = f === 'ALL' ? 'All Tracks' : getTrackConfig(f).label
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                    filter === f 
                      ? 'bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/30 shadow-[0_4px_15px_rgba(91,92,235,0.08)]' 
                      : 'text-[#475569] border-slate-200 hover:text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Podium layout */}
          <div className="grid grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
            {[1, 0, 2].map((podiumIdx, i) => {
              const entry = filtered[podiumIdx]
              if (!entry) return <div key={i} />
              const heights = ['h-48', 'h-56', 'h-40']
              const isFirst = podiumIdx === 0

              return (
                <motion.div
                  key={entry.teamId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`bg-white rounded-2xl flex flex-col items-center justify-end p-6 border transition-all duration-500 hover:shadow-[0_20px_50px_rgba(15,23,42,0.04)] ${heights[i]} ${
                    isFirst 
                      ? 'border-[#F59E0B]/30 shadow-[0_10px_30px_rgba(245,158,11,0.05)]' 
                      : 'border-slate-200/80'
                  }`}
                >
                  <Avatar name={entry.teamName} size={isFirst ? 'lg' : 'md'} className="mb-3" />
                  <h3 className="font-display font-bold text-[#0F172A] text-xs text-center line-clamp-1 mb-0.5">{entry.teamName}</h3>
                  <p className="text-[10px] text-[#475569] mb-3 font-light">{entry.college}</p>
                  <div className="font-display font-extrabold text-xl text-[#5B5CEB] mb-4">{entry.totalScore.toFixed(1)}</div>
                  <RankDisplay rank={entry.rank} />
                </motion.div>
              )
            })}
          </div>

          {/* Rankings table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(15,23,42,0.01)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">All Competing Teams</span>
              <span className="text-xs text-[#94A3B8] font-mono">{filtered.length} active</span>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="premium-table">
                <thead>
                  <tr>
                    {['Rank', 'Team Name', 'Category Track', 'Evaluations', 'Score', '▲/▼'].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((entry, i) => {
                      const track = getTrackConfig(entry.track)
                      return (
                        <motion.tr
                          key={entry.teamId}
                          custom={i}
                          variants={leaderboardRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          layout
                          className="group"
                        >
                          <td><RankDisplay rank={entry.rank} /></td>
                          <td>
                            <div className="flex items-center gap-3">
                              <Avatar name={entry.teamName} size="sm" />
                              <div>
                                <p className="font-bold text-[#0F172A] text-xs">{entry.teamName}</p>
                                <p className="text-[10px] text-[#475569] font-light mt-0.5">{entry.college}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span 
                              className="text-[9px] font-bold px-2 py-1 rounded-full border" 
                              style={{ 
                                background: `${track.color}10`, 
                                color: track.color, 
                                borderColor: `${track.color}15` 
                              }}
                            >
                              {track.label}
                            </span>
                          </td>
                          <td className="text-[#475569] text-xs font-mono">{entry.judgeCount} / 3</td>
                          <td>
                            <motion.span
                              key={entry.totalScore}
                              initial={{ scale: 1.2, color: '#5B5CEB' }}
                              animate={{ scale: 1, color: '#0F172A' }}
                              transition={{ duration: 0.3 }}
                              className="font-display font-extrabold text-sm text-[#0F172A]"
                            >
                              {entry.totalScore.toFixed(1)}
                            </motion.span>
                          </td>
                          <td>
                            <RankIndicator curr={entry.rank} prev={entry.previousRank} />
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar chart breakdown */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-[0_10px_35px_rgba(15,23,42,0.01)]">
            <h3 className="font-display font-bold text-[#0F172A] text-sm mb-1 uppercase tracking-wider">Top Team Score Metrics</h3>
            <p className="text-xs text-[#475569] mb-8 font-light">Detailed evaluations matching dynamic criteria for SpeakSense.</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(15,23,42,0.04)" />
                <PolarAngleAxis dataKey="criterion" tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }} />
                <Radar dataKey="value" stroke="#5B5CEB" fill="#5B5CEB" fillOpacity={0.1} strokeWidth={1.5} />
                <Tooltip
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid rgba(15,23,42,0.08)', 
                    borderRadius: 12, 
                    color: '#0F172A', 
                    fontSize: 11 
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  )
}
export default LeaderboardPage
