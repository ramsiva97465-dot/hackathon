import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, leaderboardRowVariants } from '@/lib/motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'

const leaderboard = [
  { rank: 1, prev: 2, team: 'SpeakSense', college: 'BITS Pilani', track: 'REAL_WORLD_DEPLOYMENT', total: 91.2, judges: 3 },
  { rank: 2, prev: 1, team: 'AudioMind', college: 'VIT Chennai', track: 'VOICE_AI_AGENT', total: 88.7, judges: 3 },
  { rank: 3, prev: 3, team: 'NovaTalk', college: 'NIT Trichy', track: 'MULTIMODAL_AI', total: 84.5, judges: 2 },
  { rank: 4, prev: 5, team: 'VoiceForge AI', college: 'IIT Madras', track: 'VOICE_AI_AGENT', total: 81.0, judges: 2 },
  { rank: 5, prev: 4, team: 'EchoBot Labs', college: 'SRM University', track: 'MULTIMODAL_AI', total: 79.3, judges: 3 },
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
    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
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
  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Leaderboard</h1>
            <p className="text-sm text-slate-500">Live standings — auto-updates as judges submit scores</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-150">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-green-700 font-semibold">Live Scoring</span>
          </div>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((entry, i) => {
            const podiumOrder = [1, 0, 2]
            const item = leaderboard[podiumOrder[i]]
            const track = getTrackConfig(item.track)
            return (
              <motion.div
                key={item.team}
                initial={{ opacity: 0, y: i === 0 ? 20 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className={`bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-sm ${
                  podiumOrder[i] === 0 ? 'border-[rgba(245,158,11,0.4)] shadow-[0_0_30px_rgba(245,158,11,0.08)]' :
                  podiumOrder[i] === 1 ? 'mt-4' : 'mt-8'
                }`}
              >
                <RankBadge rank={item.rank} />
                <div className="mt-3">
                  <Avatar name={item.team} size="md" className="mx-auto mb-2" />
                  <h3 className="font-display font-bold text-slate-900 text-sm">{item.team}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">{item.college}</p>
                  <div className="font-display text-3xl font-bold text-[#5B5CEB]">{item.total.toFixed(1)}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">{item.judges} judges</div>
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
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-4 text-left text-xs text-slate-400 font-bold uppercase tracking-wider">Rank</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 font-bold uppercase tracking-wider">Team</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 font-bold uppercase tracking-wider hidden md:table-cell">Track</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 font-bold uppercase tracking-wider hidden lg:table-cell">Judges</th>
                <th className="px-5 py-4 text-right text-xs text-slate-400 font-bold uppercase tracking-wider">Score</th>
                <th className="px-5 py-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const track = getTrackConfig(entry.track)
                return (
                  <motion.tr
                    key={entry.team}
                    custom={i}
                    variants={leaderboardRowVariants}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={entry.team} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{entry.team}</p>
                          <p className="text-xs text-slate-400 font-medium">{entry.college}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: track.bg, color: track.color }}>
                        {track.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium text-xs hidden lg:table-cell">{entry.judges} / 3</td>
                    <td className="px-5 py-4 text-right font-display font-bold text-xl text-slate-900">{entry.total.toFixed(1)}</td>
                    <td className="px-5 py-4 text-center">
                      <DeltaIcon curr={entry.rank} prev={entry.prev} />
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
