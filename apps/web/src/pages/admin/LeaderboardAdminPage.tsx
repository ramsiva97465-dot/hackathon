import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, leaderboardRowVariants } from '@/lib/motion'
import { TrendingUp, TrendingDown, Minus, Crown, Medal, Edit2 } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { api } from '@/lib/api'
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-xl rank-1 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
      <Crown size={16} className="text-black" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-xl rank-2 flex items-center justify-center">
      <Medal size={16} className="text-black" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-xl rank-3 flex items-center justify-center">
      <Medal size={16} className="text-slate-800" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center">
      <span className="font-display font-bold text-sm text-slate-500">#{rank}</span>
    </div>
  )
}

function DeltaIcon({ curr, prev }: { curr: number; prev: number }) {
  if (curr < prev) return <div className="flex items-center gap-1 text-success text-xs"><TrendingUp size={13} />{prev - curr}</div>
  if (curr > prev) return <div className="flex items-center gap-1 text-danger text-xs"><TrendingDown size={13} />{curr - prev}</div>
  return <Minus size={13} className="text-muted" />
}

export function LeaderboardAdminPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [activeRound, setActiveRound] = useState<number>(1)
  
  // Real-time updates via WebSocket
  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', (data) => {
    setEntries(data)
  })

  useEffect(() => {
    emit('leaderboard:subscribe')
    api.leaderboard.get().then(res => {
      if (res.data) setEntries(res.data)
    })
  }, [emit])

  const handleEditScore = async (teamId: string, currentScore: number) => {
    const newVal = prompt(`Override score for this team (current: ${currentScore}):\nLeave blank or cancel to keep current score.\nEnter 'clear' to remove the override.`)
    if (newVal === null) return
    
    let score: number | null = null
    if (newVal.toLowerCase() === 'clear') {
      score = null
    } else {
      const parsed = parseFloat(newVal)
      if (isNaN(parsed)) return alert('Invalid score')
      score = parsed
    }

    try {
      await api.leaderboard.adminScore(teamId, score)
    } catch (err) {
      console.error(err)
      alert('Failed to override score')
    }
  }

  const rawDisplay = entries.length > 0 ? entries : mockLeaderboard
  const display = rawDisplay
    .filter(e => {
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
      return true
    })
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">Leaderboard</h1>
            <p className="text-sm text-slate-400">Live standings — auto-updates as judges submit scores</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">Live Scoring</span>
          </div>
        </div>

        {/* Round Tab Selector */}
        <div className="flex bg-[#111] p-1 rounded-2xl gap-1 w-max border border-white/10">
          <button
            onClick={() => setActiveRound(1)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 1 ? 'bg-[#222] text-[#E83C00] shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Round 1 (All)
          </button>
          <button
            onClick={() => setActiveRound(2)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 2 ? 'bg-[#222] text-[#E83C00] shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Round 2 (Top 20)
          </button>
          <button
            onClick={() => setActiveRound(3)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRound === 3 ? 'bg-[#222] text-[#E83C00] shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Winners (Top 3)
          </button>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4">
          {display.slice(0, 3).map((_, i) => {
            const podiumOrder = [1, 0, 2]
            if (!display[podiumOrder[i]]) return <div key={i} />
            const entry = display[podiumOrder[i]]
            return (
              <motion.div
                key={entry.teamId}
                initial={{ opacity: 0, y: i === 0 ? 20 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className={`bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl text-center shadow-2xl ${
                  podiumOrder[i] === 0 ? 'border-[rgba(245,158,11,0.4)] shadow-[0_0_30px_rgba(245,158,11,0.15)]' :
                  podiumOrder[i] === 1 ? 'mt-4' : 'mt-8'
                }`}
              >
                <RankBadge rank={entry.rank} />
                <div className="mt-3">
                  <Avatar name={entry.teamName} size="md" className="mx-auto mb-2" />
                  <h3 className="font-display font-bold text-white text-sm">{entry.teamName}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">{entry.college}</p>
                  <div className="font-display text-3xl font-bold text-[#7C7DF5]">{entry.totalScore.toFixed(1)}</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">{entry.judgeCount} judges</div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Full table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#111]">
                <th className="px-5 py-4 text-left text-xs text-slate-500 font-bold uppercase tracking-wider">Rank</th>
                <th className="px-5 py-4 text-left text-xs text-slate-500 font-bold uppercase tracking-wider">Team</th>
                <th className="px-5 py-4 text-left text-xs text-slate-500 font-bold uppercase tracking-wider hidden md:table-cell">Track</th>
                <th className="px-5 py-4 text-left text-xs text-slate-500 font-bold uppercase tracking-wider hidden lg:table-cell">Judges</th>
                <th className="px-5 py-4 text-right text-xs text-slate-500 font-bold uppercase tracking-wider">Score</th>
                <th className="px-5 py-4 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">Change</th>
                <th className="px-5 py-4 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {display.map((entry, i) => {
                const track = getTrackConfig(entry.track)
                return (
                  <motion.tr
                    key={entry.teamId}
                    custom={i}
                    variants={leaderboardRowVariants}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={entry.teamName} size="sm" />
                        <div>
                          <p className="font-semibold text-white">{entry.teamName}</p>
                          <p className="text-xs text-slate-400 font-medium">{entry.college}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: track.bg, color: track.color }}>
                        {track.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-medium text-xs hidden lg:table-cell">{entry.judgeCount} / 3</td>
                    <td className="px-5 py-4 text-right font-display font-bold text-xl text-white">{entry.totalScore.toFixed(1)}</td>
                    <td className="px-5 py-4 text-center">
                      <DeltaIcon curr={entry.rank} prev={entry.previousRank || entry.rank} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => handleEditScore(entry.teamId, entry.totalScore)}
                        className="text-slate-500 hover:text-white transition-colors inline-flex p-1.5 rounded-lg hover:bg-white/10"
                        title="Override score"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
