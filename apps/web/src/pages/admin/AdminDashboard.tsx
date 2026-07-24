import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, FileText, Award, Trophy, TrendingUp, CheckCircle, 
  XCircle, Clock, Activity, ArrowUpRight, Zap, PhoneCall,
  Radio, Volume2, Network, ShieldCheck
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const stats = [
  { label: 'Total Applications', value: '124', delta: '+12 today', icon: FileText, color: 'primary', trend: 'up' },
  { label: 'Approved Teams', value: '38', delta: '+3 today', icon: CheckCircle, color: 'success', trend: 'up' },
  { label: 'Pending Review', value: '47', delta: '5 urgent', icon: Clock, color: 'warning', trend: 'neutral' },
  { label: 'Active Judges', value: '8', delta: '6 scoring', icon: Award, color: 'primary', trend: 'up' },
]

const chartData = [
  { day: 'Mon', applications: 8, approvals: 3 },
  { day: 'Tue', applications: 14, approvals: 6 },
  { day: 'Wed', applications: 22, approvals: 10 },
  { day: 'Thu', applications: 18, approvals: 8 },
  { day: 'Fri', applications: 30, approvals: 14 },
  { day: 'Sat', applications: 20, approvals: 9 },
  { day: 'Sun', applications: 12, approvals: 5 },
]

const recentApplications = [
  { team: 'VoiceForge AI', college: 'IIT Madras', track: 'VOICE_AI_AGENT', status: 'PENDING', time: '5m ago' },
  { team: 'SpeakSense', college: 'BITS Pilani', track: 'MULTIMODAL_AI', status: 'APPROVED', time: '12m ago' },
  { team: 'NovaTalk', college: 'NIT Trichy', track: 'REAL_WORLD_DEPLOYMENT', status: 'UNDER_REVIEW', time: '28m ago' },
  { team: 'AudioMind', college: 'VIT Chennai', track: 'VOICE_AI_AGENT', status: 'APPROVED', time: '1h ago' },
  { team: 'EchoBot Labs', college: 'SRM University', track: 'MULTIMODAL_AI', status: 'REJECTED', time: '2h ago' },
]

const trackProgress = [
  { track: 'Voice AI Agent', count: 52, max: 80, color: 'primary' as const },
  { track: 'Multimodal AI', count: 38, max: 80, color: 'secondary' as const },
  { track: 'Real-World Deploy', count: 34, max: 80, color: 'primary' as const },
]

// Mock live call logs representing Vobiz Telephony integration
const initialLiveCalls = [
  { id: 'vob-8291', agent: 'HelpDesk Voice', duration: '1m 24s', quality: '98%', status: 'PULSING', type: 'Inbound' },
  { id: 'vob-8290', agent: 'Lead Qualifier AI', duration: '0m 45s', quality: '99%', status: 'ACTIVE', type: 'Outbound' },
  { id: 'vob-8289', agent: 'TechSupport Agent', duration: '3m 12s', quality: '95%', status: 'COMPLETED', type: 'SIP-Trunk' },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'default' | 'warning' | 'muted' }> = {
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  PENDING: { label: 'Pending', variant: 'warning' },
  UNDER_REVIEW: { label: 'Reviewing', variant: 'default' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-lg">
      <p className="text-xs text-slate-400 font-medium mb-2">{label}</p>
      <p className="text-sm text-[#5B5CEB] font-bold">{payload[0]?.value} applications</p>
      <p className="text-sm text-success font-bold">{payload[1]?.value} approvals</p>
    </div>
  )
}

export function AdminDashboard() {
  const [liveCalls, setLiveCalls] = useState(initialLiveCalls)

  // Subtle real-time simulation for the Vobiz Live Monitor
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCalls(prev => 
        prev.map(call => {
          if (call.status === 'PULSING' || call.status === 'ACTIVE') {
            const parts = call.duration.split(' ')
            const min = parseInt(parts[0])
            const sec = parseInt(parts[1])
            const totalSec = min * 60 + sec + 1
            const nextMin = Math.floor(totalSec / 60)
            const nextSec = totalSec % 60
            return {
              ...call,
              duration: `${nextMin}m ${nextSec < 10 ? '0' : ''}${nextSec}s`,
              quality: `${Math.min(100, Math.max(92, parseInt(call.quality) + (Math.random() > 0.5 ? 1 : -1)))}%`
            }
          }
          return call
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Header - Co-branded primary identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Control Dashboard</h1>
            <p className="text-sm text-slate-500">
              Manage hackathon applicants and monitor core services.
              <span className="text-[#5B5CEB] font-semibold ml-1">Built by SnapServe.ai.</span>
              <span className="text-slate-400 mx-1">|</span>
              <span className="text-cyan-600 font-semibold">Powered by Vobiz Voice.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Vobiz Status Node */}
            <div className="flex items-center gap-2 bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-100">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs text-cyan-700 font-semibold font-mono">vobiz-node-01: OK</span>
            </div>
            {/* SnapServe Global Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-[#5B5CEB]" />
              <span className="text-xs text-slate-600 font-semibold">SnapServe core</span>
            </div>
          </div>
        </div>

        {/* Stats Grid using SnapServe Indigo Color Code */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            const colorMap: Record<string, string> = {
              primary: 'bg-[#5B5CEB]/10 border-[#5B5CEB]/20 text-[#5B5CEB]',
              success: 'bg-green-50 border-green-100 text-green-600',
              warning: 'bg-amber-50 border-amber-100 text-amber-600',
            }
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="p-5 border-slate-200/80 hover:border-[#5B5CEB]/30 hover:shadow-md transition-all duration-300 bg-white" hover>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[stat.color]}`}>
                      <Icon size={18} />
                    </div>
                    {stat.trend === 'up' && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                        <ArrowUpRight size={12} />
                        <span>up</span>
                      </div>
                    )}
                  </div>
                  <p className="font-display text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-semibold">{stat.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.delta}</p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Chart + Vobiz Monitoring + Track Distribution layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Column (2 span on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Area Chart - SnapServe Applications Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-base">Applications & Approvals</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Registration workflow progress</p>
                </div>
                <Badge variant="default" className="bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/25">
                  SnapServe Control
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B5CEB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#5B5CEB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAppr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="applications" stroke="#5B5CEB" strokeWidth={2} fill="url(#colorApp)" />
                  <Area type="monotone" dataKey="approvals" stroke="#10B981" strokeWidth={2} fill="url(#colorAppr)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Vobiz Voice-Specific Telemetry Monitor (SIP/Live Calls) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-2xl border border-cyan-200 shadow-sm relative overflow-hidden"
            >
              {/* Subtle background glow mapping Vobiz accent */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                    <PhoneCall size={15} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">Vobiz Live Session Telemetry</h3>
                    <p className="text-[10px] text-slate-400">Call monitoring & voice quality inspector</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-600 bg-cyan-50 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                  Live Channels
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">Session ID</th>
                      <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">SIP Route</th>
                      <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">Duration</th>
                      <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">Vobiz AQI</th>
                      <th className="py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-right">Waveform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {liveCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-mono text-xs text-slate-600 font-medium">{call.id}</td>
                        <td className="py-3 text-xs text-slate-700">
                          <span className="font-semibold">{call.agent}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({call.type})</span>
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-600 font-medium">{call.duration}</td>
                        <td className="py-3 text-xs">
                          <span className="font-mono text-cyan-600 font-bold bg-cyan-50 border border-cyan-100/50 px-1.5 py-0.5 rounded">
                            {call.quality}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {call.status === 'COMPLETED' ? (
                            <span className="text-[10px] font-mono text-slate-400">Idle / Done</span>
                          ) : (
                            <div className="inline-flex items-center gap-0.5 h-3 justify-end">
                              <span className="w-[2px] bg-cyan-400 rounded-full animate-waveform h-2" style={{ animationDelay: '0.1s' }} />
                              <span className="w-[2px] bg-cyan-500 rounded-full animate-waveform h-3" style={{ animationDelay: '0.3s' }} />
                              <span className="w-[2px] bg-cyan-400 rounded-full animate-waveform h-1" style={{ animationDelay: '0.5s' }} />
                              <span className="w-[2px] bg-cyan-600 rounded-full animate-waveform h-2.5" style={{ animationDelay: '0.2s' }} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Track Distribution (SnapServe logic) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
            >
              <h3 className="font-display font-semibold text-slate-900 mb-1 text-base">Track Allocation</h3>
              <p className="text-xs text-slate-400 mb-6">Distribution across teams</p>
              <div className="space-y-5">
                {trackProgress.map(t => (
                  <div key={t.track}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">{t.track}</span>
                      <span className="text-xs font-bold text-slate-900">{t.count} teams</span>
                    </div>
                    <Progress value={t.count} max={t.max} variant={t.color} size="sm" showLabel={false} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vobiz Infrastructure Node health card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-2xl border border-cyan-200 shadow-sm relative overflow-hidden"
            >
              <h3 className="font-display font-semibold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Network size={14} className="text-cyan-500" />
                Vobiz Voice Nodes
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">SIP infrastructure diagnostics</p>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Core Latency (RTT)</span>
                    <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100/50">2.4ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Channel Capacity (Live)</span>
                    <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100/50">12 / 100 ch</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full animate-pulse" style={{ width: '12%' }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">SIP Trunking Codec</span>
                  <span className="text-slate-700 font-mono font-bold">Opus / G.711</span>
                </div>
                
                <div className="flex justify-between text-[11px] -mt-1">
                  <span className="text-slate-400 font-medium">TLS Telephony Security</span>
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <ShieldCheck size={11} /> Secured
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Recent registration activity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-slate-900 text-base">Recent Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Submitted team portfolios waiting review</p>
            </div>
            <a href="/admin/applications" className="text-xs text-[#5B5CEB] hover:text-[#5B5CEB]/80 font-bold flex items-center gap-1 transition-colors">
              View all applications <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="space-y-2">
            {recentApplications.map((app, i) => (
              <motion.div
                key={app.team}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={app.team} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-[#5B5CEB] transition-colors">{app.team}</p>
                    <p className="text-xs text-slate-400 font-medium">{app.college}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-semibold font-mono hidden md:block">{app.time}</span>
                  <Badge variant={statusConfig[app.status]?.variant} size="sm" dot>
                    {statusConfig[app.status]?.label}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
