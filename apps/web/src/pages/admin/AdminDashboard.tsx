import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Award, CheckCircle, Clock,
  ArrowUpRight, Users, TrendingUp, Activity, Megaphone, Send, Trash2
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [postingAnn, setPostingAnn] = useState(false)

  // Help Requests state
  const [helpRequests, setHelpRequests] = useState<any[]>([])

  const fetchOverview = () => {
    api.analytics.overview()
      .then(res => {
        if (res.data?.success) {
          setData(res.data.data)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const fetchAnnouncements = () => {
    api.announcements.getAll()
      .then(res => setAnnouncements(res.data))
      .catch(err => console.error(err))
  }

  const fetchHelpRequests = () => {
    api.helpRequests.getActive()
      .then(res => {
        if (res.data?.success) {
          setHelpRequests(res.data.data)
        }
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchOverview()
    fetchAnnouncements()
    fetchHelpRequests()
    
    // Poll for help requests every 30 seconds
    const interval = setInterval(fetchHelpRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementMsg.trim()) return
    setPostingAnn(true)
    try {
      await api.announcements.create(announcementMsg)
      toast.success('Announcement broadcasted!')
      setAnnouncementMsg('')
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to post announcement')
    } finally {
      setPostingAnn(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await api.announcements.delete(id)
      toast.success('Deleted')
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleResolveHelp = async (id: string) => {
    try {
      await api.helpRequests.resolve(id)
      toast.success('Help request resolved!')
      fetchHelpRequests()
    } catch (err) {
      toast.error('Failed to resolve')
    }
  }

  const statsList = [
    {
      label: 'Total Teams',
      value: data?.stats?.totalTeams ?? '0',
      icon: Users,
      accent: '#E83C00',
      accentBg: 'rgba(232,60,0,0.15)',
      accentBorder: 'rgba(232,60,0,0.3)',
      gradient: 'linear-gradient(135deg, #110e0c 0%, #0a0a0a 100%)',
    },
    {
      label: 'Competing Teams',
      value: data?.stats?.competingTeams ?? '0',
      icon: CheckCircle,
      accent: '#10B981',
      accentBg: 'rgba(16,185,129,0.15)',
      accentBorder: 'rgba(16,185,129,0.3)',
      gradient: 'linear-gradient(135deg, #0d1210 0%, #0a0a0a 100%)',
    },
    {
      label: 'Total Members',
      value: data?.stats?.totalMembers ?? '0',
      icon: FileText,
      accent: '#F59E0B',
      accentBg: 'rgba(245,158,11,0.15)',
      accentBorder: 'rgba(245,158,11,0.3)',
      gradient: 'linear-gradient(135deg, #12100a 0%, #0a0a0a 100%)',
    },
    {
      label: 'Active Judges',
      value: data?.stats?.activeJudges ?? '0',
      icon: Award,
      accent: '#8B5CF6',
      accentBg: 'rgba(139,92,246,0.15)',
      accentBorder: 'rgba(139,92,246,0.3)',
      gradient: 'linear-gradient(135deg, #100d12 0%, #0a0a0a 100%)',
    },
  ]

  const maxTrackCount = Math.max(...(data?.trackAllocation?.map((x: any) => x.count) || [1])) || 1

  return (
    <DashboardLayout role="admin">
      <div className="p-5 sm:p-7 space-y-6 max-w-[1400px]">

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
            <p className="text-sm text-slate-400 mt-0.5">Voiceathon 2026 — Real-time event control</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {statsList.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <div
                  className="group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
                  style={{ background: stat.gradient, borderColor: stat.accentBorder }}
                >
                  {/* Soft glow in corner */}
                  <div
                    className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60"
                    style={{ background: stat.accent }}
                  />
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: stat.accentBg, border: `1px solid ${stat.accentBorder}`, color: stat.accent }}
                    >
                      <Icon size={16} />
                    </div>
                    <p
                      className="text-[2rem] font-bold tracking-tight tabular-nums leading-none mb-2"
                      style={{ color: '#ffffff' }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[12px] font-semibold text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: stat.accent }}>
                      <Activity size={10} className="animate-pulse" />
                      Live Data
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left: Recent Teams */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div>
                  <h3 className="font-bold text-sm text-white">Recent Registrations</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Newly imported/registered teams</p>
                </div>
                <a
                  href="/admin/teams"
                  className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:underline"
                  style={{ color: '#E83C00' }}
                >
                  View all teams <ArrowUpRight size={11} />
                </a>
              </div>

              <div className="divide-y divide-white/5">
                {data?.recentTeams?.map((app: any, i: number) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={app.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{app.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {app.track === 'real-world-deployment' ? 'Real World Deployment' : 
                           app.track === 'multimodal-ai' ? 'Multimodal AI' : 'Voice AI'} · {app.membersCount} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {(!data?.recentTeams || data.recentTeams.length === 0) && (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-medium">No teams registered/imported yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Broadcast & Track Allocation */}
          <div className="space-y-5">
            {/* Announcements Widget */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <Megaphone size={16} className="text-[#E83C00]" />
                <h3 className="font-bold text-sm text-white">Broadcast</h3>
              </div>
              
              <div className="p-5 flex-1 flex flex-col min-h-0 bg-[#050505]">
                <form onSubmit={handlePostAnnouncement} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Type an announcement..." 
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-white/10 bg-[#111] text-white focus:outline-none focus:border-[#E83C00] focus:ring-1 focus:ring-[#E83C00]/20 placeholder:text-slate-600"
                    value={announcementMsg}
                    onChange={e => setAnnouncementMsg(e.target.value)}
                    disabled={postingAnn}
                  />
                  <button 
                    type="submit" 
                    disabled={postingAnn || !announcementMsg.trim()}
                    className="shrink-0 bg-[#E83C00] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#c93400] disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    <Send size={14} />
                  </button>
                </form>

                {/* 1-Click Preset Buttons */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {[
                    '🍱 Lunch & Refreshments are served!',
                    '⏱️ 15 Minutes remaining for submission!',
                    '🏆 Final Pitching Stage has started!',
                    '📢 Welcome to AI Voice for Tamil Nadu 2026!'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnnouncementMsg(preset)}
                      className="text-[9.5px] font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-[#E83C00] transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[200px]">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-[#111] border border-white/5 rounded-lg p-3 group relative hover:border-white/20 transition-all">
                      <p className="text-xs font-medium text-slate-200 pr-6">{ann.message}</p>
                      <p className="text-[9px] text-slate-500 mt-1">{new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">No recent announcements.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Help Requests Widget */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Megaphone size={16} className="text-orange-500" />
                    {helpRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-white">Active Help Requests</h3>
                </div>
                {helpRequests.length > 0 && (
                  <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {helpRequests.length} Active
                  </span>
                )}
              </div>
              
              <div className="p-0 flex-1 flex flex-col min-h-0 bg-[#050505] max-h-[300px] overflow-y-auto">
                <div className="divide-y divide-white/5">
                  {helpRequests.map(req => (
                    <div key={req.id} className="bg-[#111] p-4 group relative hover:bg-[#1a1a1a] transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-white">{req.team?.name}</p>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20">
                              Table {req.team?.tableNumber || '?'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-red-400 mb-1">{req.issueType}</p>
                          {req.description && (
                            <p className="text-[11px] text-slate-400 leading-relaxed">{req.description}</p>
                          )}
                          <p className="text-[9px] text-slate-500 mt-2">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button 
                          onClick={() => handleResolveHelp(req.id)}
                          className="shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                  {helpRequests.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">No teams need help right now.</p>
                  )}
                </div>
              </div>
            </motion.div>


          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
