import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Zap, Trophy, RefreshCw, AlertTriangle, Play,
  Users, CheckCircle2, ChevronRight, Medal, Sparkles, ExternalLink, Crown
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
  const [isStageRevealing, setIsStageRevealing] = useState(false)
  const [revealStep, setRevealStep] = useState(0)
  
  // Stats
  const [round1Count, setRound1Count] = useState(0)
  const [round2Count, setRound2Count] = useState(0)
  const [winnersCount, setWinnersCount] = useState(0)

  useEffect(() => {
    fetchLeaderboard()
    fetchRevealState()
    const interval = setInterval(() => {
      fetchLeaderboard(true)
      fetchRevealState()
    }, 4000)
    return () => clearInterval(interval)
  }, [activeTab])

  const fetchRevealState = async () => {
    try {
      const res = await api.leaderboard.getRevealState()
      if (typeof res.data?.isRevealing === 'boolean') {
        setIsStageRevealing(res.data.isRevealing)
      }
      if (typeof res.data?.step === 'number') {
        setRevealStep(res.data.step)
      }
    } catch (err) {
      // Ignore
    }
  }

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

  const handleStartReveal = async (round: number = 2) => {
    try {
      setLoading(true)
      await api.leaderboard.startReveal(round)
      setIsStageRevealing(true)
      setRevealStep(0)
      toast.success(round === 3 ? 'Top 3 Grand Finale Reveal broadcasted to stage screens!' : 'Top 20 Grand Reveal broadcasted to stage screens!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to start reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerStep = async (step: number) => {
    try {
      setLoading(true)
      if (!isStageRevealing) {
        await api.leaderboard.startReveal(3)
        setIsStageRevealing(true)
      }
      await api.leaderboard.setRevealStep(step)
      setRevealStep(step)
      if (step === 1) toast.success('🚀 Triggered 3rd Place Reveal (5s countdown started on LCD Screen)!')
      else if (step === 2) toast.success('🚀 Triggered 2nd Place Reveal (5s countdown started on LCD Screen)!')
      else if (step === 3) toast.success('👑 Triggered Grand Champion Coronation (5s countdown + Confetti on LCD Screen)!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to trigger reveal step.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetStageToLocked = async () => {
    try {
      setLoading(true)
      await api.leaderboard.startReveal(3)
      await api.leaderboard.setRevealStep(0)
      setRevealStep(0)
      setIsStageRevealing(true)
      toast.success('Stage reset to Vault Locked mode (ready for 3rd Place announcement).')
    } catch (err) {
      console.error(err)
      toast.error('Failed to reset stage step.')
    } finally {
      setLoading(false)
    }
  }

  const handleStopReveal = async () => {
    try {
      setLoading(true)
      await api.leaderboard.stopReveal()
      setIsStageRevealing(false)
      setRevealStep(0)
      toast.success('Stage reveal ended. Returned to standard leaderboard.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to stop reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (currentRound: number) => {
    const confirmMsg = currentRound === 1 
      ? 'Are you sure you want to calculate scores and promote the Top 20 teams from Round 1 to Round 2?'
      : 'Are you sure you want to calculate scores and promote the Top 3 winners from Round 2 to Round 3?'
    
    if (!window.confirm(confirmMsg)) return

    try {
      setLoading(true)
      const res = await api.teams.promote(currentRound)
      if (res.data?.success) {
        toast.success(
          currentRound === 1
            ? `✅ Successfully promoted ${res.data.promotedCount} teams to Round 2! Click 'Broadcast Top 20 Grand Reveal' whenever you are ready to trigger the stage countdown.`
            : `✅ Successfully promoted Top 3 winners to Round 3! Use the Top 3 Controller below to reveal 3rd, 2nd, and 1st step-by-step on stage.`
        )
        // Shift active view tab to next round
        setActiveTab(currentRound + 1)
        fetchLeaderboard()
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
      await api.leaderboard.stopReveal()
      setIsStageRevealing(false)
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
            {isStageRevealing ? (
              <button
                onClick={handleStopReveal}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-xs font-bold text-rose-300 transition-all shadow-lg select-none cursor-pointer"
              >
                <span>🛑 Stop Stage Reveal</span>
              </button>
            ) : activeRoundNum === 3 ? (
              <button
                onClick={() => handleStartReveal(3)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-lg select-none cursor-pointer"
              >
                <Crown size={13} className="text-amber-400" />
                <span>👑 Broadcast Top 3 Grand Finale Reveal (3 ➔ 1)</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartReveal(2)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-lg select-none cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>🎭 Broadcast Top 20 Grand Reveal (20 ➔ 1)</span>
              </button>
            )}

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
                {activeRoundNum === 3 ? '🏆 Stage 3 (Winners Announced)' : activeRoundNum === 2 ? '⚡ Stage 2 (Top 20 Qualifiers)' : '📝 Stage 1 (All Teams Judging)'}
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
                <span>⚡ Promote Top 20 to Round 2</span>
              </button>
            )}
            {activeRoundNum === 2 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartReveal(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>🎭 Broadcast Top 20 Reveal (20 ➔ 1)</span>
                </button>
                <button
                  onClick={() => handlePromote(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
                >
                  <Crown size={14} />
                  <span>👑 Promote Top 3 to Round 3</span>
                </button>
              </div>
            )}
            {activeRoundNum === 3 && (
              <button
                onClick={() => handleStartReveal(3)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Crown size={14} className="text-amber-400" />
                <span>👑 Broadcast Top 3 Grand Finale Reveal</span>
              </button>
            )}
          </div>
        </div>

        {/* 🎭 LIVE STAGE OPERATOR CONSOLE FOR TOP 3 GRAND FINALE */}
        {(activeRoundNum === 3 || activeTab === 3 || isStageRevealing) && (
          <div className="p-6 sm:p-7 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#1e130a] via-[#120a05] to-[#0a0502] text-white shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-widest mb-2">
                  <Crown size={14} className="text-amber-400 animate-bounce" />
                  <span>Auditorium LCD Screen Live Remote Control</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Top 3 Grand Finale Reveal Controller
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 font-medium">
                  Click each button when the stage host speaks. The big LCD screen will synchronously run the <span className="text-amber-300 font-bold">5, 4, 3, 2, 1 slow countdown</span>, slot-machine name roll, sub-bass heartbeat ticks, and unseal that winner!
                </p>
              </div>

              <a
                href="/leaderboard?round=3&reveal=true"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-black text-amber-200 transition-all shadow-md shrink-0 self-start lg:self-center cursor-pointer"
              >
                <ExternalLink size={14} />
                Open Live LCD Window ↗
              </a>
            </div>

            {/* Step Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: 3rd Place */}
              <button
                onClick={() => handleTriggerStep(1)}
                disabled={loading}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden group ${
                  revealStep >= 1
                    ? 'border-amber-600/80 bg-amber-950/70 text-amber-200 shadow-lg'
                    : 'border-amber-700/40 bg-black/50 hover:bg-amber-950/40 text-slate-200 hover:border-amber-500 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-800 text-amber-100 shadow-sm">
                    Step 1
                  </span>
                  <span className={`text-xs font-bold ${revealStep >= 1 ? 'text-emerald-400 font-black' : 'text-amber-400'}`}>
                    {revealStep >= 1 ? '✅ 3rd Unsealed' : '⚡ Ready To Trigger'}
                  </span>
                </div>
                <div className="font-black text-base text-white flex items-center gap-2">
                  <Medal size={18} className="text-amber-500" />
                  <span>Reveal 2nd Runner Up (#3 🥉)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                  Triggers 5➔1 slow suspense roll & unseals Bronze Pedestal
                </p>
              </button>

              {/* Step 2: 2nd Place */}
              <button
                onClick={() => handleTriggerStep(2)}
                disabled={loading}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden group ${
                  revealStep >= 2
                    ? 'border-slate-400/80 bg-slate-900/90 text-slate-100 shadow-lg'
                    : 'border-slate-600/40 bg-black/50 hover:bg-slate-900/40 text-slate-200 hover:border-slate-300 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white shadow-sm">
                    Step 2
                  </span>
                  <span className={`text-xs font-bold ${revealStep >= 2 ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                    {revealStep >= 2 ? '✅ 2nd Unsealed' : '⚡ Ready To Trigger'}
                  </span>
                </div>
                <div className="font-black text-base text-white flex items-center gap-2">
                  <Medal size={18} className="text-slate-300" />
                  <span>Reveal 1st Runner Up (#2 🥈)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                  Triggers 5➔1 slow suspense roll & unseals Silver Pedestal
                </p>
              </button>

              {/* Step 3: Grand Champion */}
              <button
                onClick={() => handleTriggerStep(3)}
                disabled={loading}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden group ${
                  revealStep >= 3
                    ? 'border-[#E83C00] bg-gradient-to-br from-[#E83C00]/40 to-amber-500/30 text-white ring-4 ring-amber-400/60 shadow-2xl shadow-orange-950/60'
                    : 'border-amber-500/60 bg-black/50 hover:bg-amber-500/20 text-white hover:border-amber-400 hover:scale-[1.02] ring-2 ring-amber-500/30 animate-pulse'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#E83C00] to-amber-500 text-white shadow-sm">
                    👑 Step 3 (Grand Climax)
                  </span>
                  <span className={`text-xs font-bold ${revealStep >= 3 ? 'text-amber-300 font-black' : 'text-amber-300'}`}>
                    {revealStep >= 3 ? '👑 Champion Crowned!' : '🔥 Ready To Crown'}
                  </span>
                </div>
                <div className="font-black text-base text-white flex items-center gap-2">
                  <Crown size={18} className="text-amber-300 animate-bounce" />
                  <span>CROWN GRAND CHAMPION (#1)</span>
                </div>
                <p className="text-xs text-amber-200 mt-1.5 font-medium">
                  5➔1 Countdown + Dual Confetti Fireworks + Royal Fanfare
                </p>
              </button>
            </div>

            {/* Console Footer Status & Resets */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current LCD Stage Status:</span>
                <span className="font-black font-mono px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {revealStep === 0 ? '🔒 All 3 Locked (Vault Suspense)' : revealStep === 1 ? '🥉 3rd Place Unsealed' : revealStep === 2 ? '🥈 2nd Place Unsealed' : '👑 Grand Champion Crowned (Final Stage)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetStageToLocked}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Reset to Vault Locked (Step 0)
                </button>
                <button
                  onClick={handleStopReveal}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all cursor-pointer"
                >
                  🛑 Exit Stage Mode
                </button>
              </div>
            </div>
          </div>
        )}

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
