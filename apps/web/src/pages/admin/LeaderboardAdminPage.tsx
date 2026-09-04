import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, leaderboardRowVariants } from '@/lib/motion'
import { TrendingUp, TrendingDown, Minus, Crown, Medal, Edit2 } from 'lucide-react'
import { getTrackConfig } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { api } from '@/lib/api'
import type { LeaderboardEntry } from '@hackathon/shared'

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

type BoardKind = 'main' | 'special'

export function LeaderboardAdminPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [boardKind, setBoardKind] = useState<BoardKind>('main')
  const [activeRound, setActiveRound] = useState<number>(1)
  const [loadingRound, setLoadingRound] = useState(true)
  const boardKindRef = useRef(boardKind)
  const activeRoundRef = useRef(activeRound)

  useEffect(() => {
    boardKindRef.current = boardKind
  }, [boardKind])

  useEffect(() => {
    activeRoundRef.current = activeRound
  }, [activeRound])

  const fetchLeaderboard = async (
    kind = boardKindRef.current,
    round = activeRoundRef.current,
  ) => {
    try {
      const res = kind === 'special'
        ? await api.leaderboard.getSpecial({ round: round === 2 ? 2 : 1 })
        : await api.leaderboard.get({
            round,
            liveScores: round === 2,
          })
      if (kind !== boardKindRef.current || round !== activeRoundRef.current) return
      if (Array.isArray(res.data)) setEntries(res.data)
    } catch {
      // Ignore poll error
    } finally {
      if (kind === boardKindRef.current && round === activeRoundRef.current) {
        setLoadingRound(false)
      }
    }
  }

  const { emit } = useWebSocket<LeaderboardEntry[]>('leaderboard:update', () => {
    if (boardKindRef.current === 'main') fetchLeaderboard()
  })

  useWebSocket<LeaderboardEntry[]>('leaderboard:special_update', () => {
    if (boardKindRef.current === 'special') fetchLeaderboard()
  })

  useEffect(() => {
    emit('leaderboard:subscribe')
    fetchLeaderboard(boardKind, activeRound)

    const interval = setInterval(() => fetchLeaderboard(), 3000)
    const handleUpdate = () => fetchLeaderboard()

    window.addEventListener('leaderboard_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('leaderboard_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [emit, boardKind, activeRound])

  const handleBoardChange = (kind: BoardKind, round: number) => {
    if (kind === boardKind && round === activeRound) return
    setBoardKind(kind)
    setActiveRound(round)
    setEntries([])
    setLoadingRound(true)
  }

  const handleEditScore = async (teamId: string, currentScore: number) => {
    const newVal = prompt(`Override score for this team (current: ${currentScore}):\nLeave blank or cancel to keep current score.\nEnter 'clear' to remove the override.`)
    if (newVal === null) return
    const trimmed = newVal.trim()
    if (trimmed === '') return

    let score: number | null = null
    if (trimmed.toLowerCase() === 'clear') {
      score = null
    } else {
      const parsed = parseFloat(trimmed)
      if (isNaN(parsed)) return alert('Invalid score')
      score = parsed
    }

    try {
      await api.leaderboard.adminScore(teamId, score)
      fetchLeaderboard()
    } catch (err) {
      console.error(err)
      alert('Failed to override score')
    }
  }

  const rawDisplay = entries
  const display = rawDisplay
    .filter(e => {
      if (boardKind === 'special') return true
      const teamRound = (e as any).round || 1
      if (activeRound === 3) return teamRound === 3
      if (activeRound === 2) return teamRound >= 2
      return true
    })
    .map((e, idx) => ({ ...e, rank: idx + 1 }))

  const tabClass = (active: boolean, special = false) =>
    `px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
      active
        ? special
          ? 'bg-sky-500/20 text-sky-300 shadow-sm'
          : 'bg-[#222] text-[#E83C00] shadow-sm'
        : 'text-slate-500 hover:text-slate-300'
    }`

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
        <div className="flex flex-wrap bg-[#111] p-1 rounded-2xl gap-1 w-max max-w-full border border-white/10">
          <button
            onClick={() => handleBoardChange('main', 1)}
            className={tabClass(boardKind === 'main' && activeRound === 1)}
          >
            Round 1 (All)
          </button>
          <button
            onClick={() => handleBoardChange('main', 2)}
            className={tabClass(boardKind === 'main' && activeRound === 2)}
          >
            Round 2 (Top 20)
          </button>
          <button
            onClick={() => handleBoardChange('main', 3)}
            className={tabClass(boardKind === 'main' && activeRound === 3)}
          >
            Winners (Top 5)
          </button>
          <span className="w-px bg-white/10 self-stretch mx-0.5" aria-hidden />
          <button
            onClick={() => handleBoardChange('special', 1)}
            className={tabClass(boardKind === 'special' && activeRound === 1, true)}
          >
            Special R1
          </button>
          <button
            onClick={() => handleBoardChange('special', 2)}
            className={tabClass(boardKind === 'special' && activeRound === 2, true)}
          >
            Special R2 (Top 5)
          </button>
        </div>

        {/* Top 5 podium — main winners tab only */}
        {boardKind === 'main' && activeRound === 3 && (
        <div className="grid grid-cols-5 gap-3">
          {display.slice(0, 5).map((_, i) => {
            const podiumOrder = [3, 1, 0, 2, 4]
            if (!display[podiumOrder[i]]) return <div key={i} />
            const entry = display[podiumOrder[i]]
            const place = podiumOrder[i]
            return (
              <motion.div
                key={entry.teamId}
                initial={{ opacity: 0, y: place === 0 ? 20 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.5 }}
                className={`bg-[#0A0A0A] border border-white/10 p-4 rounded-2xl text-center shadow-2xl ${
                  place === 0 ? 'border-[rgba(245,158,11,0.4)] shadow-[0_0_30px_rgba(245,158,11,0.15)]' :
                  place === 1 ? 'mt-3' : 'mt-6'
                }`}
              >
                <RankBadge rank={entry.rank} />
                <div className="mt-3">
                  <Avatar name={entry.teamName} size="md" className="mx-auto mb-2" />
                  <h3 className="font-display font-bold text-white text-sm">{entry.teamName}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">{entry.college}</p>
                  <div className="font-display text-3xl font-bold text-[#7C7DF5]">{entry.totalScore.toFixed(1)}</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">{entry.judgeCount > 0 ? '1 / 1 Judge' : '0 / 1 Judge'}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
        )}

        {/* Full table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="px-5 py-3 border-b border-white/5 bg-[#111] flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {boardKind === 'special'
                ? activeRound === 2
                  ? 'Special Category · Round 2 (Top 5)'
                  : 'Special Category · Round 1'
                : activeRound === 3
                  ? 'Main · Winners (Top 5)'
                  : activeRound === 2
                    ? 'Main · Round 2 (Top 20)'
                    : 'Main · Round 1 (All)'}
            </p>
            <span className="text-[11px] font-bold text-slate-500">{display.length} teams</span>
          </div>
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
              {loadingRound && display.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                    Loading this round's scores...
                  </td>
                </tr>
              )}
              {!loadingRound && display.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                    No teams on this board yet.
                  </td>
                </tr>
              )}
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
                    <td className="px-5 py-4 text-slate-400 font-medium text-xs hidden lg:table-cell">{entry.judgeCount > 0 ? `${entry.judgeCount}` : '0'}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-display font-bold text-xl text-white">{entry.totalScore.toFixed(1)}</div>
                      {(entry as { adminOverride?: boolean }).adminOverride && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mt-0.5">Admin override</div>
                      )}
                    </td>
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
