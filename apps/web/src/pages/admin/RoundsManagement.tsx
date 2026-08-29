import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Zap, Trophy, RefreshCw, AlertTriangle, Play,
  Users, CheckCircle2, ChevronRight, Medal, Sparkles, ExternalLink
} from 'lucide-react'

type TeamOverview = {
  teamId: string
  teamName: string
  track: string
  overallScore: number
  judgeCount: number
  round: number
}

export function RoundsManagement() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<number>(1) // 1 = Round 1, 2 = Round 2, 3 = Winners
  const [teams, setTeams] = useState<TeamOverview[]>([])
  
  // Stats
  const [round1Count, setRound1Count] = useState(0)
  const [round2Count, setRound2Count] = useState(0)
  const [winnersCount, setWinnersCount] = useState(0)

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(() => fetchLeaderboard(true), 10_000)
    return () => clearInterval(interval)
  }, [activeTab])

  const fetchLeaderboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.leaderboard.get({ round: activeTab })
      if (Array.isArray(res.data)) {
        setTeams(res.data)
      }

      // Fetch overall stats by querying all
      const statsRes = await api.leaderboard.get()
      if (Array.isArray(statsRes.data)) {
        const all: TeamOverview[] = statsRes.data
        setRound1Count(all.length)
        setRound2Count(all.filter(t => t.round >= 2).length)
        setWinnersCount(all.filter(t => t.round === 3).length)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load rounds data.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handlePromote = async (currentRound: number) => {
    const confirmMsg = currentRound === 1 
      ? 'Are you sure you want to promote the Top 20 teams from Round 1 to Round 2 & start the Countdown Reveal?'
      : 'Are you sure you want to lock Round 2 and select the Top 3 winners?'
    
    if (!window.confirm(confirmMsg)) return

    try {
      setLoading(true)
      const res = await api.teams.promote(currentRound)
      if (res.data?.success) {
        toast.success(`Successfully promoted ${res.data.promotedCount} teams! Countdown reveal broadcasted.`)
        // Shift active view tab to next round
        setActiveTab(currentRound + 1)
        fetchLeaderboard()

        if (currentRound === 1) {
          // Open leaderboard with reveal mode
          window.open('/leaderboard?reveal=true&round=2', '_blank')
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Promotion failed. Make sure teams have scores.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will reset ALL teams back to Round 1. Proceed?')) return

    try {
      setLoading(true)
      const res = await api.teams.resetRounds()
      if (res.data?.success) {
        toast.success('All teams have been reset to Round 1!')
        setActiveTab(1)
        fetchLeaderboard()
      }
    } catch (err) {
      console.error(err)
      toast.error('Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  const activeRoundNum = winnersCount > 0 ? 3 : round2Count > 0 ? 2 : 1

  return (
    <DashboardLayout role="admin">
      <div className="p-5 sm:p-7 space-y-6 max-w-[1400px]" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap size={22} className="text-[#E83C00]" />
              Rounds Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Control stages, promote top teams, and select winners</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/leaderboard?reveal=true&round=2"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-lg select-none cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>🎭 Launch Top 20 Grand Reveal (20 ➔ 1)</span>
              <ExternalLink size={12} className="text-amber-400/70" />
            </a>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 bg-[#111] hover:bg-[#1a1a1a] rounded-xl text-xs font-bold text-slate-300 transition-all shadow-2xl hover:text-white cursor-pointer"
            >
              <RefreshCw size={13} />
              Reset All to Round 1
            </button>
          </div>
        </div>

        {/* Current Active Round Status Bar */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E83C00]/10 border border-[#E83C00]/20 flex items-center justify-center text-[#E83C00]">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Judging State</span>
              <h2 className="text-lg font-black text-white">
                {activeRoundNum === 3 ? '🏆 Winners Announced' : activeRoundNum === 2 ? '⚡ Round 2 (Top 20 Qualifiers)' : '📝 Round 1 (All Teams)'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeRoundNum === 1 && (
              <button
                onClick={() => handlePromote(1)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
              >
                <Play size={13} fill="white" />
                Promote Top 20 & Start Grand Reveal
              </button>
            )}
            {activeRoundNum === 2 && (
              <div className="flex items-center gap-2">
                <a
                  href="/leaderboard?reveal=true&round=2"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles size={13} />
                  Replay Grand Reveal (20 ➔ 1)
                </a>
                <button
                  onClick={() => handlePromote(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
                >
                  <Trophy size={13} />
                  Announce Winners (Top 3)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Round Tab Selector */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setActiveTab(1)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === 1 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Round 1 ({round1Count})
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === 2 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Round 2 ({round2Count > 20 ? 20 : round2Count})
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === 3 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Winners ({winnersCount})
          </button>
        </div>

        {/* Winners Podium Component (If Tab 3 / Winners Active) */}
        {activeTab === 3 && teams.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto py-6">
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center justify-end order-2 md:order-1">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-center w-full max-w-[240px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-slate-300" />
                <Medal size={32} className="text-slate-300 mb-2" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2nd Place</span>
                <h3 className="text-lg font-black text-white mt-1">{teams[1]?.teamName}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{teams[1]?.track}</p>
                <span className="mt-3 text-2xl font-black text-slate-300 block">{teams[1]?.overallScore}</span>
              </div>
            </div>

            {/* 1st Place (Gold) */}
            <div className="flex flex-col items-center justify-end order-1 md:order-2">
              <div className="bg-[#0A0A0A] border-2 border-amber-500/50 rounded-2xl p-8 text-center w-full max-w-[260px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl transform md:-translate-y-4">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-400" />
                <Trophy size={42} className="text-amber-500 mb-2 drop-shadow-lg" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">1st Place Winner</span>
                <h3 className="text-xl font-black text-white mt-1">{teams[0]?.teamName}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{teams[0]?.track}</p>
                <span className="mt-3 text-3xl font-black text-amber-500 block drop-shadow-md">{teams[0]?.overallScore}</span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center justify-end order-3 md:order-3">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-center w-full max-w-[240px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-800" />
                <Medal size={32} className="text-amber-600 mb-2" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">3rd Place</span>
                <h3 className="text-lg font-black text-white mt-1">{teams[2]?.teamName}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{teams[2]?.track}</p>
                <span className="mt-3 text-2xl font-black text-slate-300 block">{teams[2]?.overallScore}</span>
              </div>
            </div>
          </div>
        )}

        {/* Teams Table */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-[#111] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {activeTab === 3 ? 'Winners Standings' : activeTab === 2 ? 'Round 2 Qualified Teams' : 'Round 1 Leaderboard'}
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {teams.length} Teams
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs font-medium">No teams are active or graded in this round yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Team Name</th>
                    <th className="px-6 py-3">Track</th>
                    <th className="px-6 py-3 text-center">Judges Graded</th>
                    <th className="px-6 py-3 text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {teams.map((t, idx) => (
                    <tr key={t.teamId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {t.teamName}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {t.track}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-300">
                        {t.judgeCount}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white">
                        {t.overallScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
