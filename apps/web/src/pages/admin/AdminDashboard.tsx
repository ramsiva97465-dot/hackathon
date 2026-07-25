import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Award, CheckCircle, Clock,
  ArrowUpRight, PhoneCall, Network, ShieldCheck,
  TrendingUp, Activity
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'

const stats = [
  {
    label: 'Total Applications',
    value: '124',
    delta: '+12 today',
    icon: FileText,
    accent: '#E83C00',
    accentBg: 'rgba(232,60,0,0.08)',
    accentBorder: 'rgba(232,60,0,0.15)',
    gradient: 'linear-gradient(135deg, #fff7f5 0%, #ffffff 100%)',
  },
  {
    label: 'Approved Teams',
    value: '38',
    delta: '+3 today',
    icon: CheckCircle,
    accent: '#10B981',
    accentBg: 'rgba(16,185,129,0.08)',
    accentBorder: 'rgba(16,185,129,0.15)',
    gradient: 'linear-gradient(135deg, #f0fdf8 0%, #ffffff 100%)',
  },
  {
    label: 'Pending Review',
    value: '47',
    delta: '5 urgent',
    icon: Clock,
    accent: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.15)',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
  },
  {
    label: 'Active Judges',
    value: '8',
    delta: '6 scoring now',
    icon: Award,
    accent: '#8B5CF6',
    accentBg: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.15)',
    gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
  },
]

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'primary' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  UNDER_REVIEW: { label: 'Reviewing', variant: 'primary' },
}

const recentApplications = [
  { team: 'VoiceForge AI', college: 'IIT Madras', track: 'Voice AI', status: 'PENDING', time: '5m ago' },
  { team: 'SpeakSense', college: 'BITS Pilani', track: 'Multimodal', status: 'APPROVED', time: '12m ago' },
  { team: 'NovaTalk', college: 'NIT Trichy', track: 'Deployment', status: 'UNDER_REVIEW', time: '28m ago' },
  { team: 'AudioMind', college: 'VIT Chennai', track: 'Voice AI', status: 'APPROVED', time: '1h ago' },
  { team: 'EchoBot Labs', college: 'SRM University', track: 'Multimodal', status: 'REJECTED', time: '2h ago' },
]

const trackProgress = [
  { track: 'Voice AI Agent', count: 52, max: 80, color: '#E83C00' },
  { track: 'Multimodal AI', count: 38, max: 80, color: '#8B5CF6' },
  { track: 'Real-World Deploy', count: 34, max: 80, color: '#06B6D4' },
]

export function AdminDashboard() {

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
          {stats.map((stat) => {
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
                      <TrendingUp size={10} />
                      {stat.delta}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left: Vobiz + Recent Apps */}
          <div className="lg:col-span-2 space-y-5">



            {/* Recent Applications */}
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
                  <h3 className="font-bold text-sm text-slate-900">Recent Applications</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Team portfolios awaiting review</p>
                </div>
                <a
                  href="/admin/applications"
                  className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:underline"
                  style={{ color: '#E83C00' }}
                >
                  View all <ArrowUpRight size={11} />
                </a>
              </div>

              <div className="divide-y divide-slate-50">
                {recentApplications.map((app, i) => (
                  <motion.div
                    key={app.team}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={app.team} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{app.team}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{app.college} · {app.track}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-300 hidden md:block">{app.time}</span>
                      <Badge variant={statusConfig[app.status]?.variant} size="sm" dot>
                        {statusConfig[app.status]?.label}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">

            {/* Track Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Track Allocation</h3>
              <p className="text-[10px] text-slate-400 mb-5">Distribution across all registered teams</p>
              <div className="space-y-5">
                {trackProgress.map(t => (
                  <div key={t.track}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">{t.track}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: t.color }}>{t.count} teams</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${t.color}, ${t.color}99)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(t.count / t.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>



          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
