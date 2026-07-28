import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Award, CheckCircle, Clock,
  ArrowUpRight, Users, TrendingUp, Activity
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'
import { api } from '@/lib/api'

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.analytics.overview()
      .then(res => {
        if (res.data?.success) {
          setData(res.data.data)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const statsList = [
    {
      label: 'Total Teams',
      value: data?.stats?.totalTeams ?? '0',
      icon: Users,
      accent: '#E83C00',
      accentBg: 'rgba(232,60,0,0.08)',
      accentBorder: 'rgba(232,60,0,0.15)',
      gradient: 'linear-gradient(135deg, #fff7f5 0%, #ffffff 100%)',
    },
    {
      label: 'Competing Teams',
      value: data?.stats?.competingTeams ?? '0',
      icon: CheckCircle,
      accent: '#10B981',
      accentBg: 'rgba(16,185,129,0.08)',
      accentBorder: 'rgba(16,185,129,0.15)',
      gradient: 'linear-gradient(135deg, #f0fdf8 0%, #ffffff 100%)',
    },
    {
      label: 'Total Members',
      value: data?.stats?.totalMembers ?? '0',
      icon: FileText,
      accent: '#F59E0B',
      accentBg: 'rgba(245,158,11,0.08)',
      accentBorder: 'rgba(245,158,11,0.15)',
      gradient: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
    },
    {
      label: 'Active Judges',
      value: data?.stats?.activeJudges ?? '0',
      icon: Award,
      accent: '#8B5CF6',
      accentBg: 'rgba(139,92,246,0.08)',
      accentBorder: 'rgba(139,92,246,0.15)',
      gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">Voiceathon 2026 — Real-time event control</p>
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
                      style={{ color: '#0F172A' }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[12px] font-semibold text-slate-500 mb-1">{stat.label}</p>
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
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #F1F5F9' }}
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recent Registrations</h3>
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

              <div className="divide-y divide-slate-50">
                {data?.recentTeams?.map((app: any, i: number) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={app.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{app.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {app.track === 'real-world-deployment' ? 'Real World Deployment' : 
                           app.track === 'multimodal-ai' ? 'Multimodal AI' : 'Voice AI'} · {app.membersCount} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400">
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

          {/* Right Column: Track Allocation */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Track Allocation</h3>
              <p className="text-[10px] text-slate-400 mb-5">Distribution across all registered teams</p>
              <div className="space-y-5">
                {data?.trackAllocation?.map((t: any) => {
                  const colors: Record<string, string> = {
                    'real-world-deployment': '#06B6D4',
                    'multimodal-ai': '#8B5CF6',
                    'voice-ai-agent': '#E83C00'
                  }
                  const color = colors[t.name] || '#E83C00'
                  const cleanName = t.name === 'real-world-deployment' ? 'Real World Deployment' : 
                                    t.name === 'multimodal-ai' ? 'Multimodal AI' : 'Voice AI'

                  return (
                    <div key={t.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">{cleanName}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color }}>{t.count} teams</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.count / maxTrackCount) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  )
                })}
                {(!data?.trackAllocation || data.trackAllocation.length === 0) && (
                  <p className="text-center text-xs text-slate-400 py-4">No track distribution data.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
