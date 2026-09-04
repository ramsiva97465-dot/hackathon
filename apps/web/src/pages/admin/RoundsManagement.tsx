import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Zap, Trophy, RefreshCw, AlertTriangle, Play,
  Users, CheckCircle2, ChevronRight, Medal, Sparkles, Crown
} from 'lucide-react'

type TeamOverview = {
  teamId: string
  teamName: string
  track: string
  totalScore: number
  overallScore?: number
  judgeCount: number
  round: number
}

export function RoundsManagement() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<number>(1) // 1 = Round 1, 2 = Round 2, 3 = Winners
  const [isSpecialBoard, setIsSpecialBoard] = useState(false)
  const [teams, setTeams] = useState<TeamOverview[]>([])
  const [isStageRevealing, setIsStageRevealing] = useState(false)
  const [revealStep, setRevealStep] = useState(0)
  const [revealRound, setRevealRound] = useState(2)
  const [revealNextAllowedAt, setRevealNextAllowedAt] = useState(0)
  const [stageClock, setStageClock] = useState(() => Date.now())
  const [revealedQualifierRanks, setRevealedQualifierRanks] = useState<number[]>([])

  // Special Category ceremony (isolated from main Top 20 / Top 5)
  const [specialIsRevealing, setSpecialIsRevealing] = useState(false)
  const [specialPhase, setSpecialPhase] = useState<'TOP5' | 'FINALE'>('TOP5')
  const [specialStep, setSpecialStep] = useState(0)
  const [specialR1Count, setSpecialR1Count] = useState(0)
  const [specialR2Count, setSpecialR2Count] = useState(0)
  const [specialNextAllowedAt, setSpecialNextAllowedAt] = useState(0)
  const [showSpecialTrackPanel, setShowSpecialTrackPanel] = useState(false)
  const specialTrackPanelRef = useRef<HTMLDivElement>(null)
  
  // Stats
  const [round1Count, setRound1Count] = useState(0)
  const [round2Count, setRound2Count] = useState(0)
  const [winnersCount, setWinnersCount] = useState(0)

  useEffect(() => {
    fetchLeaderboard()
    fetchRevealState()
    fetchSpecialRevealState()
    fetchSpecialCounts()
    const interval = setInterval(() => {
      fetchLeaderboard(true)
      fetchRevealState()
      fetchSpecialRevealState()
      fetchSpecialCounts(true)
    }, 4000)
    return () => clearInterval(interval)
  }, [activeTab, isSpecialBoard])

  useEffect(() => {
    const timer = setInterval(() => setStageClock(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  // Keep Special Category controls visible during an active special ceremony.
  useEffect(() => {
    if (specialIsRevealing || specialR2Count > 0) {
      setShowSpecialTrackPanel(true)
    }
  }, [specialIsRevealing, specialR2Count])

  const fetchRevealState = async () => {
    try {
      const res = await api.leaderboard.getRevealState()
      if (typeof res.data?.isRevealing === 'boolean') {
        setIsStageRevealing(res.data.isRevealing)
      }
      if (typeof res.data?.step === 'number') {
        setRevealStep(res.data.step)
      }
      if (typeof res.data?.round === 'number') {
        setRevealRound(res.data.round)
        if (res.data.round === 2 && typeof res.data?.step === 'number' && res.data.step > 0) {
          const rank = 21 - res.data.step
          setRevealedQualifierRanks((prev) => prev.includes(rank) ? prev : [...prev, rank])
        }
      }
      if (typeof res.data?.nextAllowedAt === 'number') {
        setRevealNextAllowedAt(res.data.nextAllowedAt)
      }
    } catch (err) {
      // Ignore
    }
  }

  const fetchSpecialRevealState = async () => {
    try {
      const res = await api.leaderboard.getSpecialRevealState()
      if (typeof res.data?.isRevealing === 'boolean') {
        setSpecialIsRevealing(res.data.isRevealing)
      }
      if (res.data?.phase === 'TOP5' || res.data?.phase === 'FINALE') {
        setSpecialPhase(res.data.phase)
      }
      if (typeof res.data?.step === 'number') {
        setSpecialStep(res.data.step)
      }
    } catch {
      // Ignore
    }
  }

  const fetchSpecialCounts = async (silent = false) => {
    try {
      const [r1, r2] = await Promise.all([
        api.leaderboard.getSpecial({ round: 1 }),
        api.leaderboard.getSpecial({ round: 2 }),
      ])
      if (Array.isArray(r1.data)) setSpecialR1Count(r1.data.length)
      if (Array.isArray(r2.data)) setSpecialR2Count(r2.data.length)
    } catch {
      if (!silent) {
        // counts are optional
      }
    }
  }

  const openSpecialTrackPanel = (roundTab?: 1 | 2) => {
    if (roundTab) {
      setIsSpecialBoard(false)
      setActiveTab(roundTab)
    }
    setShowSpecialTrackPanel(true)
    window.setTimeout(() => {
      specialTrackPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const selectMainTab = (tab: number) => {
    setIsSpecialBoard(false)
    setActiveTab(tab)
  }

  const selectSpecialTab = (tab: 1 | 2) => {
    setIsSpecialBoard(true)
    setActiveTab(tab)
    setShowSpecialTrackPanel(true)
  }

  const handlePromoteSpecial = async () => {
    if (!window.confirm('Promote the Top 5 Special Category teams from Round 1 to Round 2?')) return
    try {
      setLoading(true)
      const res = await api.teams.promoteSpecial()
      if (res.data?.success) {
        toast.success(res.data.message || `Promoted ${res.data.promotedCount ?? 5} Special Category teams to Round 2.`)
        await fetchSpecialCounts()
        await fetchLeaderboard(true)
        openSpecialTrackPanel(1)
      } else {
        toast.error(res.data?.message || 'Special Category promote failed.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to promote Special Category teams.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSpecialReveal = async (phase: 'TOP5' | 'FINALE') => {
    try {
      setLoading(true)
      try {
        await api.leaderboard.stopReveal()
        setIsStageRevealing(false)
        setRevealStep(0)
      } catch {
        // ignore — main ceremony may already be idle
      }
      await api.leaderboard.startSpecialReveal(phase)
      setSpecialIsRevealing(true)
      setSpecialPhase(phase)
      setSpecialStep(0)
      toast.success(
        phase === 'TOP5'
          ? 'Special Category Top 5 ceremony opened on the LCD.'
          : 'Special Category Finale opened — reveal Runner, then Winner.'
      )
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start Special Category reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialRevealStep = async (step: number, phase: 'TOP5' | 'FINALE') => {
    const expected = specialIsRevealing && specialPhase === phase ? specialStep + 1 : 1
    if (step !== expected) {
      toast.error(
        phase === 'TOP5'
          ? `Reveal #${6 - expected} first (step ${expected}).`
          : expected === 1
            ? 'Reveal Runner first, then Winner.'
            : 'Reveal Winner next.'
      )
      return
    }
    if (specialIsRevealing && specialPhase === phase && Date.now() < specialNextAllowedAt) {
      const wait = Math.ceil((specialNextAllowedAt - Date.now()) / 1000)
      toast.error(`Current Special Category animation is still running. Wait ${wait}s.`)
      return
    }
    try {
      setLoading(true)
      if (!specialIsRevealing || specialPhase !== phase) {
        await api.leaderboard.startSpecialReveal(phase)
      }
      await api.leaderboard.setSpecialRevealStep(step, phase)
      setSpecialIsRevealing(true)
      setSpecialPhase(phase)
      setSpecialStep(step)
      // Match LCD: TOP5 = 5s card; Runner = 28s place beat; Winner = 22s champion beat.
      const lockMs =
        phase === 'TOP5' ? 5000 : step === 1 ? 28000 : 22000
      setSpecialNextAllowedAt(Date.now() + lockMs)
      if (phase === 'TOP5') {
        toast.success(`Special Category #${6 - step} reveal triggered.`)
      } else {
        toast.success(step === 1 ? 'Special Category Runner reveal triggered.' : 'Special Category Winner reveal triggered.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to step Special Category reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handleStopSpecialReveal = async () => {
    try {
      setLoading(true)
      await api.leaderboard.stopSpecialReveal()
      setSpecialIsRevealing(false)
      setSpecialStep(0)
      setSpecialNextAllowedAt(0)
      toast.success('Special Category stage reveal ended.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop Special Category reveal.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      if (isSpecialBoard) {
        const specialRound = activeTab === 2 ? 2 : 1
        const res = await api.leaderboard.getSpecial({ round: specialRound })
        if (Array.isArray(res.data)) {
          setTeams(res.data)
        }
      } else {
        const res = await api.leaderboard.get({
          round: activeTab,
          liveScores: activeTab === 2,
        })
        if (Array.isArray(res.data)) {
          setTeams(res.data)
        }
      }

      // Fetch overall stats by querying all (main track only for counts)
      const statsRes = await api.leaderboard.get()
      if (Array.isArray(statsRes.data)) {
        const all: TeamOverview[] = statsRes.data
        setRound1Count(all.filter(t => (t.round || 1) === 1).length)
        // Finalists sit in round 3 but still belong to the Top 20 qualifier list,
        // so Round 2 stays at 20 after the Grand Finale promotion.
        setRound2Count(all.filter(t => (t.round || 1) >= 2).length)
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
      // If Special Category ceremony is live/stuck, stop it first so Top 20 can open.
      try {
        await api.leaderboard.stopSpecialReveal()
        setSpecialIsRevealing(false)
        setSpecialStep(0)
      } catch {
        // ignore — Special may already be idle
      }
      await api.leaderboard.startReveal(round)
      setIsStageRevealing(true)
      setRevealStep(0)
      setRevealRound(round)
      setRevealNextAllowedAt(Date.now())
      if (round === 2) setRevealedQualifierRanks([])
      toast.success(round === 3
        ? 'Top 5 Grand Finale stage is ready. All five identities are locked on every LCD!'
        : 'Top 20 ceremony opened on the LCD. Use Reveal on each team in the Round 2 table (20 → 1).')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to start reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrepareFinaleStage = async () => {
    if (
      revealRound === 3
      && revealStep > 0
      && !window.confirm('This will lock all five winner cards again and return every LCD to the Grand Finale ready screen. Continue?')
    ) return

    await handleStartReveal(3)
  }

  const handleTriggerStep = async (step: number) => {
    const finaleProgress = revealRound === 3 ? revealStep : 0
    const nextStep = finaleProgress + 1
    if (step !== nextStep) {
      toast.error(`Reveal step ${nextStep} first. Unseal 5th, then 4th, then 3rd, then 2nd, then the Champion.`)
      return
    }
    try {
      setLoading(true)
      // Do not call startReveal here — that resets the ceremony to step 0
      // and would re-broadcast a Top-20-style start. Each click is one place.
      await api.leaderboard.setRevealStep(step, 3)
      setIsStageRevealing(true)
      setRevealStep(step)
      setRevealRound(3)
      const stepLocks = [0, 41000, 28000, 28000, 28000, 22000]
      setRevealNextAllowedAt(Date.now() + stepLocks[step])
      if (step === 1) toast.success('Triggered 5th Place reveal (countdown started on LCD)!')
      else if (step === 2) toast.success('Triggered 4th Place reveal (countdown started on LCD)!')
      else if (step === 3) toast.success('Triggered 2nd Runner Up reveal (countdown started on LCD)!')
      else if (step === 4) toast.success('Triggered 1st Runner Up reveal (countdown started on LCD)!')
      else if (step === 5) toast.success('Triggered Grand Champion coronation (countdown + rolling on LCD)!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to trigger reveal step.')
    } finally {
      setLoading(false)
    }
  }

  const nextQualifierRank = (() => {
    for (let r = 20; r >= 1; r--) {
      if (!revealedQualifierRanks.includes(r)) return r
    }
    return 0
  })()

  const handleRevealQualifier = async (rank: number) => {
    if (rank !== nextQualifierRank) {
      toast.error(`Reveal #${nextQualifierRank} first. Teams must be announced from #20 down to #1.`)
      return
    }
    const step = 21 - rank
    try {
      setLoading(true)
      await api.leaderboard.setRevealStep(step, 2)
      setIsStageRevealing(true)
      setRevealStep(step)
      setRevealRound(2)
      setRevealedQualifierRanks((prev) => prev.includes(rank) ? prev : [...prev, rank])
      toast.success(`Triggered #${rank} reveal (5➔0 countdown started on LCD)!`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to trigger team reveal.')
    } finally {
      setLoading(false)
    }
  }

  const handleUndoFinalists = async () => {
    if (!window.confirm(
      'Send the current Top 5 finalists back to Round 2?\n\nNo scores are deleted. Use this when the Top 5 was promoted before Round 2 judging finished, then assign judges, complete Round 2 scoring, and promote again.'
    )) return

    try {
      setLoading(true)
      const res = await api.teams.undoFinalists()
      if (res.data?.success) {
        toast.success(res.data.message || 'Finalists moved back to Round 2.')
        setActiveTab(2)
        fetchLeaderboard()
      } else {
        toast.error(res.data?.message || 'Nothing to move back.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Could not move finalists back.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetStageToLocked = async () => {
    try {
      setLoading(true)
      await api.leaderboard.startReveal(3)
      await api.leaderboard.setRevealStep(0, 3)
      setRevealStep(0)
      setRevealRound(3)
      setIsStageRevealing(true)
      setRevealNextAllowedAt(Date.now())
      toast.success('Stage reset to Vault Locked mode (ready for 5th Place announcement).')
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
      toast.success('Stage reveal ended. Last unsealed winners stay visible on the public podium.')
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
      : 'Are you sure you want to calculate scores and promote the Top 5 Grand Finale winners from Round 2 to Round 3?'
    
    if (!window.confirm(confirmMsg)) return

    try {
      setLoading(true)
      const res = await api.teams.promote(currentRound)
      if (res.data?.success) {
        toast.success(
          currentRound === 1
            ? `✅ Successfully promoted ${res.data.promotedCount} teams to Round 2! Use Reveal on each team in the Round 2 table (20 → 1) when you are ready.`
            : `✅ Promoted Top 5. The public board is now on the sealed Grand Finale ready screen. Use Reveal 5th / 4th / … to announce winners.`
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
        toast.success(res.data.message || 'Reset complete: teams back to Round 1, all judge assignments cleared.')
        setActiveTab(1)
        setIsSpecialBoard(false)
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
  const displayTeams = isSpecialBoard
    ? teams
    : activeTab === 2
      ? teams.filter(t => (t.round || 1) >= 2)
      : activeTab === 3
        ? teams.filter(t => t.round === 3)
        : teams

  const tableTeams = (!isSpecialBoard && activeTab === 2
    ? displayTeams
        .slice()
        .sort((a, b) => Number(b.totalScore ?? b.overallScore ?? 0) - Number(a.totalScore ?? a.overallScore ?? 0))
        .slice(0, 20)
        .map((t, i) => ({ ...t, standing: i + 1 }))
        .reverse()
    : displayTeams.map((t, i) => ({ ...t, standing: i + 1 })))

  const showRound2Reveals = !isSpecialBoard && activeTab === 2 && winnersCount === 0

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
            {isStageRevealing && (
              <button
                onClick={handleStopReveal}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-xs font-bold text-rose-300 transition-all shadow-lg select-none cursor-pointer"
              >
                <span>🛑 Exit Stage Reveal</span>
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
                {activeRoundNum === 3 ? '🏆 Stage 3 (Top 5 Finalists Ready)' : activeRoundNum === 2 ? '⚡ Stage 2 (Top 20 Qualifiers Competing)' : '📝 Stage 1 (All Teams Evaluation)'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeRoundNum === 1 && (
              <>
                <button
                  onClick={() => handlePromote(1)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
                >
                  <Play size={13} fill="white" />
                  <span>⚡ Promote Top 20 to Round 2</span>
                </button>
                <button
                  onClick={handlePromoteSpecial}
                  disabled={loading || specialR1Count === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 disabled:opacity-50 cursor-pointer"
                  title="Promote the Top 5 Special Category teams from Round 1 to Round 2"
                >
                  <Play size={13} fill="white" />
                  <span>⚡ Promote special category to round 2</span>
                </button>
                <button
                  onClick={() => handleStartReveal(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>🎭 Open Top 20 Ceremony</span>
                </button>
              </>
            )}
            {activeRoundNum === 2 && (
              <>
                <button
                  onClick={() => handleStartReveal(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>🎭 Open Top 20 Ceremony</span>
                </button>
                <button
                  onClick={() => handlePromote(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
                >
                  <Crown size={14} />
                  <span>👑 Promote Top 5</span>
                </button>
                <button
                  onClick={() => {
                    openSpecialTrackPanel(1)
                    toast.success('Special Category Top 5 shortlist reveal controls are open below.')
                  }}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#E83C00]/15 cursor-pointer"
                  title="Open Special Category Top 5 shortlist reveal (#5 → #1)"
                >
                  <Crown size={14} />
                  <span>👑 Promote Top 5 Special category to round 2</span>
                </button>
                <button
                  onClick={() => {
                    openSpecialTrackPanel(2)
                    toast.success('Special Category Winner / Runner controls are open below.')
                  }}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Open Special Category Runner / Winner reveal"
                >
                  <Crown size={14} />
                  <span>👑 Reveal Special category Winners</span>
                </button>
              </>
            )}
            {activeRoundNum === 3 && (
              <>
                <button
                  onClick={handlePrepareFinaleStage}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E83C00] to-amber-500 hover:from-[#ff4b0a] hover:to-amber-400 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-950/30 ring-1 ring-amber-300/30 disabled:opacity-50 cursor-pointer"
                  title="Lock all five identities and open the Grand Finale ready screen on every LCD"
                >
                  <Crown size={14} className="fill-amber-200/30" />
                  <span>
                    {isStageRevealing && revealRound === 3 && revealStep === 0
                      ? 'Re-send Top 5 Stage Ready'
                      : 'Set Top 5 Reveal Stage Ready'}
                  </span>
                </button>
                <button
                  onClick={() => handlePromote(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Re-run the Top 5 calculation using the latest Round 2 scores"
                >
                  <RefreshCw size={13} />
                  <span>Recalculate Top 5</span>
                </button>
                <button
                  onClick={handleUndoFinalists}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Move the current finalists back to Round 2 without deleting any scores"
                >
                  <ChevronRight size={13} className="rotate-180" />
                  <span>Send Finalists Back to Round 2</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* LIVE STAGE OPERATOR CONSOLE FOR TOP 5 GRAND FINALE
            Only after Promote Top 5. Reveal Top 20 must not open this. */}
        {winnersCount > 0 && (
          <div className="p-6 sm:p-7 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#1e130a] via-[#120a05] to-[#0a0502] text-white shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-widest mb-2">
                  <Crown size={14} className="text-amber-400 animate-bounce" />
                  <span>Auditorium LCD Screen Live Remote Control</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Top 5 Grand Finale Reveal Controller
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 font-medium">
                  Click each button when the stage host speaks. <span className="text-amber-300 font-bold">5th place</span> opens with a slow falling-word rain, holds <span className="text-amber-300 font-bold">5 seconds</span>, then reveals. Every place runs <span className="text-amber-300 font-bold">countdown → rolling → team name</span> (places 4–2: <span className="text-amber-300 font-bold">28s</span>, champion: <span className="text-amber-300 font-bold">22s</span>), then the LCD shows all Top 5 in one line.
                </p>
              </div>

            </div>

            {/* Step Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {([
                { step: 1, label: 'Reveal 5th Place (#5)', done: '5th Unsealed', accent: 'amber', countdown: '8s rain + 5s hold + 28s (count→roll→name)' },
                { step: 2, label: 'Reveal 4th Place (#4)', done: '4th Unsealed', accent: 'slate', countdown: '28s count → roll → name' },
                { step: 3, label: 'Reveal 2nd Runner Up (#3)', done: '3rd Unsealed', accent: 'bronze', countdown: '28s count → roll → name' },
                { step: 4, label: 'Reveal 1st Runner Up (#2)', done: '2nd Unsealed', accent: 'silver', countdown: '28s Final Two (slow)' },
                { step: 5, label: 'CROWN GRAND CHAMPION (#1)', done: 'Champion Crowned!', accent: 'gold', countdown: '22s count → roll → name → lineup' },
              ] as const).map(({ step, label, done, accent, countdown }) => {
                const isGold = accent === 'gold'
                const finaleProgress = revealRound === 3 ? revealStep : 0
                const doneNow = revealRound === 3 && revealStep >= step
                const isNext = step === finaleProgress + 1
                const waitSeconds = Math.max(0, Math.ceil((revealNextAllowedAt - stageClock) / 1000))
                const isSequenceLocked = isNext && waitSeconds > 0
                return (
              <button
                key={step}
                onClick={() => handleTriggerStep(step)}
                disabled={loading || !isNext || isSequenceLocked}
                title={isSequenceLocked ? `Current stage animation has ${waitSeconds}s remaining` : isNext ? label : doneNow ? done : `Reveal step ${finaleProgress + 1} first`}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                  isGold
                    ? doneNow
                      ? 'border-[#E83C00] bg-gradient-to-br from-[#E83C00]/40 to-amber-500/30 text-white ring-2 ring-amber-400/60 shadow-2xl'
                      : isNext
                        ? 'border-amber-500/60 bg-black/50 hover:bg-amber-500/20 text-white hover:border-amber-400 ring-2 ring-amber-500/30 cursor-pointer'
                        : 'border-amber-900/40 bg-black/30 text-slate-500 opacity-50 cursor-not-allowed'
                    : doneNow
                      ? 'border-amber-600/80 bg-amber-950/70 text-amber-200 shadow-lg'
                      : isNext
                        ? 'border-amber-700/40 bg-black/50 hover:bg-amber-950/40 text-slate-200 hover:border-amber-500 cursor-pointer'
                        : 'border-white/10 bg-black/30 text-slate-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${isGold ? 'bg-gradient-to-r from-[#E83C00] to-amber-500 text-white' : 'bg-amber-800 text-amber-100'}`}>
                    {isGold ? '👑 Step 5' : `Step ${step}`}
                  </span>
                  <span className={`text-[10px] font-bold ${doneNow ? 'text-emerald-400' : isNext ? 'text-amber-400' : 'text-slate-500'}`}>
                    {doneNow ? `✅ ${done}` : isSequenceLocked ? `⏳ Wait ${waitSeconds}s` : isNext ? '⚡ Ready' : '🔒 Locked'}
                  </span>
                </div>
                <div className="font-black text-sm text-white flex items-center gap-1.5">
                  {isGold ? <Crown size={16} className="text-amber-300" /> : <Medal size={16} className="text-amber-500" />}
                  <span>{label}</span>
                </div>
                <p className="text-[11px] text-amber-400/90 mt-1.5 font-medium">
                  {countdown}
                </p>
              </button>
                )
              })}
            </div>

            {/* Console Footer Status & Resets */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current LCD Stage Status:</span>
                <span className="font-black font-mono px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {revealStep === 0 ? '🔒 All 5 Locked (Vault Suspense)'
                    : revealStep === 1 ? '5th Place Unsealed'
                    : revealStep === 2 ? '4th Place Unsealed'
                    : revealStep === 3 ? '🥉 3rd Place Unsealed'
                    : revealStep === 4 ? '🥈 2nd Place Unsealed'
                    : '👑 Grand Champion Crowned (Final Stage)'}
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
        <div className="flex flex-wrap border-b border-white/10 gap-4 sm:gap-6">
          <button
            onClick={() => selectMainTab(1)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${!isSpecialBoard && activeTab === 1 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Round 1 ({round1Count})
          </button>
          <button
            onClick={() => selectMainTab(2)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${!isSpecialBoard && activeTab === 2 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Round 2 ({round2Count > 20 ? 20 : round2Count})
          </button>
          <button
            onClick={() => selectMainTab(3)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${!isSpecialBoard && activeTab === 3 ? 'border-[#E83C00] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Winners ({winnersCount})
          </button>
          <span className="hidden sm:block w-px self-stretch bg-white/10 mb-3" aria-hidden />
          <button
            onClick={() => selectSpecialTab(1)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${isSpecialBoard && activeTab === 1 ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-500 hover:text-sky-300/80'}`}
          >
            Special R1 ({specialR1Count})
          </button>
          <button
            onClick={() => selectSpecialTab(2)}
            className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${isSpecialBoard && activeTab === 2 ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-500 hover:text-sky-300/80'}`}
          >
            Special R2 ({specialR2Count})
          </button>
        </div>

        {/* Winners Podium Component (If Tab 3 / Winners Active) */}
        {!isSpecialBoard && activeTab === 3 && teams.length >= 1 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto py-6">
            {[0, 1, 2, 3, 4].map((i) => {
              const t = teams[i]
              if (!t) return <div key={i} />
              const isFirst = i === 0
              const labels = ['Grand Champion', '1st Runner Up', '2nd Runner Up', '4th Place', '5th Place']
              return (
              <div key={t.teamId} className={`flex flex-col items-center ${isFirst ? 'order-first md:order-none' : ''}`}>
              <div className={`bg-[#0A0A0A] rounded-2xl p-5 text-center w-full flex flex-col items-center relative overflow-hidden shadow-2xl ${isFirst ? 'border-2 border-amber-500/50' : 'border border-white/10'}`}>
                <div className={`absolute top-0 inset-x-0 h-1 ${isFirst ? 'bg-amber-400' : i === 1 ? 'bg-slate-300' : i === 2 ? 'bg-amber-800' : 'bg-slate-600'}`} />
                {isFirst ? <Trophy size={32} className="text-amber-500 mb-2" /> : <Medal size={28} className="text-slate-300 mb-2" />}
                <span className={`text-[10px] font-bold uppercase tracking-widest block ${isFirst ? 'text-amber-500' : 'text-slate-400'}`}>{labels[i]}</span>
                <h3 className="text-base font-black text-white mt-1 truncate w-full">{t.teamName}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 truncate w-full">{t.track}</p>
                <span className={`mt-3 text-xl font-black block ${isFirst ? 'text-amber-500' : 'text-slate-300'}`}>{t.totalScore ?? t.overallScore}</span>
              </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Teams Table */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-[#111] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isSpecialBoard
                  ? activeTab === 2
                    ? 'Special Category · Round 2 (Top 5)'
                    : 'Special Category · Round 1'
                  : activeTab === 3
                    ? 'Winners Standings'
                    : activeTab === 2
                      ? 'Round 2 Qualified Teams'
                      : 'Round 1 Leaderboard'}
              </h3>
              {showRound2Reveals && (
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  Listed #20 → #1. Each Reveal unseals only that team on the live leaderboard (5➔0 countdown).
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isSpecialBoard && activeTab === 2 && tableTeams.length > 0 && (
                <button
                  disabled={loading}
                  onClick={async () => {
                    try {
                      setLoading(true)
                      const res = await api.teams.autoDistributeJudges(1, 2)
                      if (res.data?.success) {
                        toast.success(res.data.message || 'Auto-assigned Round 2 teams to judges!')
                        fetchLeaderboard()
                      } else {
                        toast.error(res.data?.message || 'Assignment failed')
                      }
                    } catch (e) {
                      toast.error('Failed to auto-assign Round 2')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Users size={12} className="text-amber-400" />
                  <span>⚡ Assign All Judges to Top 20</span>
                </button>
              )}
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {tableTeams.length} Teams
              </span>
            </div>
          </div>

          {tableTeams.length === 0 ? (
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
                    {showRound2Reveals && (
                      <th className="px-6 py-3 text-right">Reveal</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {tableTeams.map((t) => {
                    const rank = t.standing
                    const alreadyRevealed = revealedQualifierRanks.includes(rank)
                    const isNext = rank === nextQualifierRank
                    return (
                    <tr key={t.teamId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-500">
                        #{rank}
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
                        {t.totalScore ?? t.overallScore}
                      </td>
                      {showRound2Reveals && (
                        <td className="px-6 py-4 text-right">
                          {alreadyRevealed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                              <CheckCircle2 size={11} />
                              Revealed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevealQualifier(rank)}
                              disabled={loading || !isNext}
                              title={isNext ? `Reveal #${rank} on the live leaderboard` : `Reveal #${nextQualifierRank} first`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                isNext
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 cursor-pointer'
                                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Sparkles size={11} />
                              Reveal
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Special Category — Round 1: Top 5 shortlist reveal | Round 2: Winner / Runner */}
        {showSpecialTrackPanel && (isSpecialBoard || activeTab !== 3) && (
        <div
          ref={specialTrackPanelRef}
          className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-black uppercase tracking-widest mb-2">
                <Medal size={13} />
                Special Category Track · {isSpecialBoard ? 'Scores' : `Round ${activeTab}`}
              </div>
              <h2 className="text-lg font-black text-white">School Special Category</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                {activeTab === 1 || (isSpecialBoard && activeTab !== 2)
                  ? 'After promote, reveal the Top 5 shortlist (#5 → #1) on the /leaderboard LCD — separate from main Top 20.'
                  : 'After Special Round 2 judging, reveal Runner then Winner on the /leaderboard LCD — separate from main Top 5.'}
              </p>
              <p className="text-xs text-sky-300/80 mt-2 font-semibold">
                R1 pool: {specialR1Count} · R2 finalists: {specialR2Count}
                {specialIsRevealing ? ` · Live: ${specialPhase} step ${specialStep}` : ''}
              </p>
            </div>
            {specialIsRevealing && (
              <button
                type="button"
                onClick={handleStopSpecialReveal}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-xs font-bold text-rose-300 transition-all cursor-pointer shrink-0"
              >
                Exit Special Reveal
              </button>
            )}
          </div>

          {activeTab === 1 && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePromoteSpecial}
                  disabled={loading || specialR1Count === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E83C00] hover:bg-[#c93400] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play size={13} fill="white" />
                  Promote Special Category to Round 2
                </button>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-sky-200">Reveal Special Category Top 5</h3>
                  <button
                    type="button"
                    onClick={() => handleStartSpecialReveal('TOP5')}
                    disabled={loading || specialR2Count === 0}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    Open Ceremony
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Announce the shortlisted 5 teams (#5 → #1). Sequential lock.</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((step) => {
                    const rank = 6 - step
                    const done = specialIsRevealing && specialPhase === 'TOP5' && specialStep >= step
                    const isNext = (!specialIsRevealing || specialPhase !== 'TOP5')
                      ? step === 1
                      : specialStep + 1 === step
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => handleSpecialRevealStep(step, 'TOP5')}
                        disabled={loading || !isNext || specialR2Count === 0}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          done
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : isNext
                              ? 'bg-sky-500 text-black border border-sky-400 cursor-pointer'
                              : 'bg-white/5 text-slate-500 border border-white/10 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {done ? `#${rank} Done` : `Reveal #${rank}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 2 && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-sky-200">Reveal Winner / Runner</h3>
                <button
                  type="button"
                  onClick={() => handleStartSpecialReveal('FINALE')}
                  disabled={loading || specialR2Count === 0}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Open Finale
                </button>
              </div>
              <p className="text-[11px] text-slate-400">After Round 2 judging: Runner first, then Winner.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { step: 1, label: 'Reveal Runner', doneLabel: 'Runner Done' },
                  { step: 2, label: 'Reveal Winner', doneLabel: 'Winner Done' },
                ].map(({ step, label, doneLabel }) => {
                  const done = specialIsRevealing && specialPhase === 'FINALE' && specialStep >= step
                  const isNext = (!specialIsRevealing || specialPhase !== 'FINALE')
                    ? step === 1
                    : specialStep + 1 === step
                  const locked =
                    isNext
                    && specialIsRevealing
                    && specialPhase === 'FINALE'
                    && specialStep > 0
                    && stageClock < specialNextAllowedAt
                  const waitSeconds = locked
                    ? Math.max(0, Math.ceil((specialNextAllowedAt - stageClock) / 1000))
                    : 0
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleSpecialRevealStep(step, 'FINALE')}
                      disabled={loading || !isNext || specialR2Count === 0 || locked}
                      className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        done
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : isNext && !locked
                            ? 'bg-sky-500 text-black border border-sky-400 cursor-pointer'
                            : 'bg-white/5 text-slate-500 border border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {done ? doneLabel : locked ? `Wait ${waitSeconds}s` : label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        )}

      </div>
    </DashboardLayout>
  )
}
