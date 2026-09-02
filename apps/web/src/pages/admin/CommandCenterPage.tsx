import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Radio, Pause, Play, StopCircle, Send, Shield, ShieldOff,
  Activity, Users, Award, Trophy, Clock, Zap, AlertTriangle,
  CheckCircle, MessageSquare, TrendingUp, BarChart3, Eye,
  Megaphone, RefreshCw, Wifi, WifiOff, Heart
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PulseMetric {
  label: string
  value: number | string
  icon: any
  accent: string
  suffix?: string
  description: string
}

interface ActivityEvent {
  id: string
  type: 'score' | 'help' | 'announce' | 'team' | 'judge' | 'system'
  message: string
  timestamp: string
  teamName?: string
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CommandCenterPage() {
  // Data state
  const [hackathonStatus, setHackathonStatus] = useState<'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'ENDED'>('LIVE')
  const [stats, setStats] = useState<any>(null)
  const [judges, setJudges] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [helpRequests, setHelpRequests] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [leaderboardFrozen, setLeaderboardFrozen] = useState(false)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [quickMsg, setQuickMsg] = useState('')
  const [sending, setSending] = useState(false)

  // Countdown timer
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })

  // Health score
  const [healthScore, setHealthScore] = useState(0)

  // Activity feed
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([])

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      const [overviewRes, judgesRes, teamsRes, helpRes, annRes] = await Promise.allSettled([
        api.analytics.overview(),
        api.judges.list(),
        api.teams.list(),
        api.helpRequests.getActive(),
        api.announcements.getAll(),
      ])

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
        setStats(overviewRes.value.data.data)
      }
      if (judgesRes.status === 'fulfilled' && judgesRes.value.data?.success) {
        setJudges(judgesRes.value.data.data)
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value.data?.success) {
        setTeams(teamsRes.value.data.data)
      }
      if (helpRes.status === 'fulfilled' && helpRes.value.data?.success) {
        setHelpRequests(helpRes.value.data.data)
      }
      if (annRes.status === 'fulfilled') {
        setAnnouncements(Array.isArray(annRes.value.data) ? annRes.value.data : [])
      }

      setConnected(true)
      setLastRefresh(new Date())
    } catch {
      setConnected(false)
    }
  }, [])

  // ── Calculate derived metrics ───────────────────────────────────────────
  useEffect(() => {
    const totalJudges = judges.length || 0
    const activeJudges = judges.filter((j: any) => j.isActive).length
    const scoringJudges = judges.filter((j: any) => j.completedScores > 0).length
    const totalTeams = teams.length || 0
    const teamsWithSubmissions = teams.filter((t: any) => t.judgesAssigned > 0).length
    const unresolvedHelp = helpRequests.length

    // Health score calculation
    const judgeActivity = totalJudges > 0 ? (scoringJudges / totalJudges) * 30 : 30
    const teamCoverage = totalTeams > 0 ? (teamsWithSubmissions / totalTeams) * 30 : 30
    const helpHealth = Math.max(0, 20 - (unresolvedHelp * 5))
    const connectivity = connected ? 20 : 0
    setHealthScore(Math.round(judgeActivity + teamCoverage + helpHealth + connectivity))

    // Build activity feed from announcements and help requests
    const feed: ActivityEvent[] = []
    announcements.slice(0, 5).forEach((ann: any) => {
      feed.push({
        id: `ann-${ann.id}`,
        type: 'announce',
        message: ann.message,
        timestamp: ann.createdAt,
      })
    })
    helpRequests.slice(0, 5).forEach((req: any) => {
      feed.push({
        id: `help-${req.id}`,
        type: 'help',
        message: `${req.team?.name || 'Team'} needs help: ${req.issueType}`,
        timestamp: req.createdAt,
        teamName: req.team?.name,
      })
    })

    // Sort by timestamp descending
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setActivityFeed(feed.slice(0, 8))
  }, [judges, teams, helpRequests, announcements, connected])

  // ── Auto-refresh every 10s ──────────────────────────────────────────────
  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 10000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    const endTime = new Date()
    endTime.setHours(endTime.getHours() + 8) // Default 8h hackathon

    const timer = setInterval(() => {
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setCountdown({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Quick Broadcast ─────────────────────────────────────────────────────
  const handleBroadcast = async () => {
    if (!quickMsg.trim()) return
    setSending(true)
    try {
      await api.announcements.create(quickMsg)
      toast.success('📢 Announcement broadcasted!')
      setQuickMsg('')
      fetchAllData()
    } catch {
      toast.error('Failed to broadcast')
    } finally {
      setSending(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const totalTeams = stats?.stats?.totalTeams ?? teams.length ?? 0
  const totalJudges = judges.length
  const activeJudges = judges.filter((j: any) => j.isActive).length
  const scoringComplete = judges.filter((j: any) => j.completedScores >= j.totalTeams && j.totalTeams > 0).length
  const totalScores = judges.reduce(
    (sum: number, j: any) => sum + Math.min(j.completedScores || 0, j.totalTeams || 0),
    0,
  )
  const totalPossible = judges.reduce((sum: number, j: any) => sum + (j.totalTeams || 0), 0)
  const scoringProgress = totalPossible > 0 ? Math.round((totalScores / totalPossible) * 100) : 0

  const pulseMetrics: PulseMetric[] = [
    { label: 'Teams Active', value: totalTeams, icon: Users, accent: '#E83C00', description: 'Competing teams' },
    { label: 'Judges Online', value: `${activeJudges}/${totalJudges}`, icon: Award, accent: '#8B5CF6', description: 'Active right now' },
    { label: 'Scoring Progress', value: scoringProgress, icon: TrendingUp, accent: '#10B981', suffix: '%', description: `${totalScores}/${totalPossible} scores` },
    { label: 'Help Requests', value: helpRequests.length, icon: AlertTriangle, accent: helpRequests.length > 0 ? '#EF4444' : '#10B981', description: helpRequests.length > 0 ? 'Needs attention' : 'All clear' },
  ]

  const statusConfig = {
    NOT_STARTED: { label: 'NOT STARTED', color: '#64748B', pulse: false, bg: 'rgba(100,116,139,0.15)' },
    LIVE: { label: 'HACKATHON LIVE', color: '#10B981', pulse: true, bg: 'rgba(16,185,129,0.08)' },
    PAUSED: { label: 'PAUSED', color: '#F59E0B', pulse: true, bg: 'rgba(245,158,11,0.08)' },
    ENDED: { label: 'EVENT ENDED', color: '#EF4444', pulse: false, bg: 'rgba(239,68,68,0.08)' },
  }

  const currentStatus = statusConfig[hackathonStatus]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'score': return <BarChart3 size={12} />
      case 'help': return <AlertTriangle size={12} />
      case 'announce': return <Megaphone size={12} />
      case 'team': return <Users size={12} />
      case 'judge': return <Award size={12} />
      default: return <Activity size={12} />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'score': return '#10B981'
      case 'help': return '#EF4444'
      case 'announce': return '#E83C00'
      case 'team': return '#3B82F6'
      case 'judge': return '#8B5CF6'
      default: return '#64748B'
    }
  }

  const healthColor = healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444'
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Needs Attention' : 'Critical'

  return (
    <DashboardLayout role="admin">
      <div className="min-h-[calc(100vh-64px)] p-5 sm:p-7 space-y-5 max-w-[1400px]">

        {/* ── Header Row ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #E83C00, #B92E00)', boxShadow: '0 0 30px rgba(232,60,0,0.3)' }}
              >
                <Radio size={22} className="text-white" />
              </div>
              {hackathonStatus === 'LIVE' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#050505] animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
              <p className="text-xs text-white/40 mt-0.5">Real-time hackathon operations · Auto-refresh 10s</p>
            </div>
          </div>

          {/* Connection & Refresh Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
              {connected ? (
                <Wifi size={12} className="text-emerald-400" />
              ) : (
                <WifiOff size={12} className="text-red-400" />
              )}
              <span className="text-[10px] font-bold text-white/60">
                {connected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
              <RefreshCw size={12} className="text-white/40 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-[10px] font-bold text-white/40">
                {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Status Beacon + Countdown ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #0f0f0f 100%)', borderColor: `${currentStatus.color}33` }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 gap-6">
            {/* Left: Status */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: currentStatus.bg, border: `2px solid ${currentStatus.color}44` }}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{
                      background: currentStatus.color,
                      boxShadow: `0 0 20px ${currentStatus.color}88`,
                      animation: currentStatus.pulse ? 'pulse 2s infinite' : 'none'
                    }}
                  />
                </div>
                {currentStatus.pulse && (
                  <div
                    className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                    style={{ border: `2px solid ${currentStatus.color}` }}
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: currentStatus.color }}>
                  {currentStatus.label}
                </p>
                <p className="text-white/40 text-[11px] font-medium">Voiceathon 2026 · AI Voice Agent Challenge</p>
              </div>
            </div>

            {/* Center: Countdown */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/30" />
              <div className="flex items-center gap-1">
                {[
                  { val: String(countdown.hours).padStart(2, '0'), label: 'HRS' },
                  { val: String(countdown.minutes).padStart(2, '0'), label: 'MIN' },
                  { val: String(countdown.seconds).padStart(2, '0'), label: 'SEC' },
                ].map((t, i) => (
                  <div key={t.label} className="flex items-center gap-1">
                    {i > 0 && <span className="text-white/20 text-lg font-bold mx-0.5">:</span>}
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-white tabular-nums tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {t.val}
                      </span>
                      <span className="text-[8px] font-bold text-white/25 uppercase tracking-widest -mt-1">{t.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Controls */}
            <div className="flex items-center gap-2">
              {hackathonStatus === 'LIVE' ? (
                <button
                  onClick={() => setHackathonStatus('PAUSED')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border"
                  style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#F59E0B' }}
                >
                  <Pause size={14} /> Pause
                </button>
              ) : hackathonStatus === 'PAUSED' ? (
                <button
                  onClick={() => setHackathonStatus('LIVE')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border"
                  style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#10B981' }}
                >
                  <Play size={14} /> Resume
                </button>
              ) : (
                <button
                  onClick={() => setHackathonStatus('LIVE')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                >
                  <Play size={14} /> Go Live
                </button>
              )}
              <button
                onClick={() => setHackathonStatus('ENDED')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                <StopCircle size={14} /> End
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Pulse Metrics ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pulseMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#0A0A0A', borderColor: `${metric.accent}22` }}
              >
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity"
                  style={{ background: metric.accent }}
                />
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${metric.accent}15`, color: metric.accent }}
                  >
                    <Icon size={15} />
                  </div>
                  <p className="text-2xl font-black text-white tabular-nums leading-none">
                    {metric.value}{metric.suffix || ''}
                  </p>
                  <p className="text-[11px] font-semibold text-white/50 mt-1">{metric.label}</p>
                  <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1" style={{ color: metric.accent }}>
                    <Activity size={9} className="animate-pulse" /> {metric.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Main Grid: Activity + Health + Quick Actions ──────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left: Live Activity Stream */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity size={16} className="text-[#E83C00]" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <h3 className="font-bold text-sm text-white">Live Activity Stream</h3>
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Auto-refresh</span>
            </div>

            <div className="divide-y divide-white/5">
              <AnimatePresence>
                {activityFeed.length > 0 ? activityFeed.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${getEventColor(event.type)}15`, color: getEventColor(event.type) }}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 leading-relaxed">{event.message}</p>
                      <p className="text-[10px] text-white/25 font-mono mt-1">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                      style={{ background: getEventColor(event.type) }}
                    />
                  </motion.div>
                )) : (
                  <div className="py-16 text-center">
                    <Activity size={28} className="mx-auto mb-3 text-white/10" />
                    <p className="text-xs text-white/30 font-medium">No activity yet. Events will appear here in real-time.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-5">

            {/* Health Score */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} style={{ color: healthColor }} />
                <h3 className="font-bold text-sm text-white">Hackathon Health</h3>
              </div>

              {/* Circular Progress */}
              <div className="flex justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      stroke={healthColor}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 264' }}
                      animate={{ strokeDasharray: `${(healthScore / 100) * 264} 264` }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ filter: `drop-shadow(0 0 6px ${healthColor}66)` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{healthScore}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Score</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs font-bold mb-4" style={{ color: healthColor }}>{healthLabel}</p>

              {/* Health Breakdown */}
              <div className="space-y-2.5">
                {[
                  { label: 'Judges Scoring', value: judges.length > 0 ? Math.round((judges.filter((j: any) => j.completedScores > 0).length / judges.length) * 100) : 0 },
                  { label: 'Team Coverage', value: teams.length > 0 ? Math.round((teams.filter((t: any) => t.judgesAssigned > 0).length / teams.length) * 100) : 0 },
                  { label: 'Help Response', value: Math.max(0, 100 - (helpRequests.length * 25)) },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-semibold text-white/40">{item.label}</span>
                      <span className="font-bold text-white/60">{item.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.value >= 70 ? '#10B981' : item.value >= 40 ? '#F59E0B' : '#EF4444' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Broadcast */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Megaphone size={16} className="text-[#E83C00]" />
                <h3 className="font-bold text-sm text-white">Quick Broadcast</h3>
              </div>
              <div className="flex gap-2">
                <input
                  value={quickMsg}
                  onChange={e => setQuickMsg(e.target.value)}
                  placeholder="Broadcast a message…"
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white focus:outline-none focus:border-[#E83C00] placeholder:text-white/20"
                  onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
                  disabled={sending}
                />
                <button
                  onClick={handleBroadcast}
                  disabled={sending || !quickMsg.trim()}
                  className="shrink-0 bg-[#E83C00] text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-[#c93400] disabled:opacity-40 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm text-white">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLeaderboardFrozen(!leaderboardFrozen)
                    toast.success(leaderboardFrozen ? '🔓 Leaderboard unfrozen' : '🔒 Leaderboard frozen')
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:-translate-y-0.5"
                  style={{
                    background: leaderboardFrozen ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: leaderboardFrozen ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {leaderboardFrozen ? <ShieldOff size={16} className="text-blue-400" /> : <Shield size={16} className="text-white/30" />}
                  <span className="text-[10px] font-bold text-white/50">{leaderboardFrozen ? 'Unfreeze' : 'Freeze'} Board</span>
                </button>

                <button
                  onClick={() => {
                    toast.success('📧 Reminders sent to inactive judges!')
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <MessageSquare size={16} className="text-white/30" />
                  <span className="text-[10px] font-bold text-white/50">Nudge Judges</span>
                </button>

                <button
                  onClick={() => window.open('/admin/leaderboard', '_self')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <Eye size={16} className="text-white/30" />
                  <span className="text-[10px] font-bold text-white/50">Live Board</span>
                </button>

                <button
                  onClick={() => window.open('/admin/rounds', '_self')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <Trophy size={16} className="text-white/30" />
                  <span className="text-[10px] font-bold text-white/50">Manage Rounds</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Scoring Overview Bar ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Overall Scoring Progress</h3>
            </div>
            <span className="text-xs font-black text-white tabular-nums">{scoringProgress}%</span>
          </div>

          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, #E83C00, ${scoringProgress >= 80 ? '#10B981' : scoringProgress >= 50 ? '#F59E0B' : '#E83C00'})`,
                boxShadow: `0 0 12px rgba(232,60,0,0.4)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${scoringProgress}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="flex justify-between mt-3 text-[10px] font-semibold text-white/25">
            <span>{totalScores} scores submitted</span>
            <span>{totalPossible - totalScores} remaining</span>
          </div>

          {/* Judge Progress Mini Cards */}
          {judges.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {judges.slice(0, 8).map((judge: any) => {
                const prog = judge.totalTeams > 0
                  ? Math.min(100, Math.round((judge.completedScores / judge.totalTeams) * 100))
                  : 0
                return (
                  <div
                    key={judge.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                      style={{
                        background: prog === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: prog === 100 ? '#10B981' : '#fff',
                      }}
                    >
                      {judge.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/60 truncate">{judge.name}</p>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${prog}%`,
                            background: prog === 100 ? '#10B981' : prog > 50 ? '#F59E0B' : '#E83C00',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-white/30 tabular-nums">{prog}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

      </div>
    </DashboardLayout>
  )
}
