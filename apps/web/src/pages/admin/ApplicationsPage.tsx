import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckCircle, XCircle,
  ChevronDown, Github,
  FileText, Users, Calendar,
  Phone, Mail, Code2,
  Lightbulb, Mic, BadgeCheck
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id: string; name: string; email: string; phone?: string
  linkedin?: string; github?: string; role?: string
}

interface Application {
  id: string; teamName: string; projectTitle: string; projectDescription: string
  voiceExperience?: string; techStack?: string[]; track: string
  members: Member[]; status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  submittedAt: string; reviewedAt?: string; rejectionReason?: string
}

type FilterStatus = 'ALL' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

const STATUS_CONFIG = {
  APPROVED:     { label: 'Approved',  color: '#059669', bg: 'rgba(5,150,105,0.10)',  dot: '#10B981', border: 'rgba(5,150,105,0.20)' },
  REJECTED:     { label: 'Rejected',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)', dot: '#EF4444', border: 'rgba(220,38,38,0.20)' },
  PENDING:      { label: 'Pending',   color: '#D97706', bg: 'rgba(217,119,6,0.10)', dot: '#F59E0B', border: 'rgba(217,119,6,0.20)' },
  UNDER_REVIEW: { label: 'In Review', color: '#2563EB', bg: 'rgba(37,99,235,0.10)', dot: '#3B82F6', border: 'rgba(37,99,235,0.20)' },
} as const

const TRACK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  VOICE_AI_AGENT:        { label: 'Voice AI',       color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' },
  MULTIMODAL_AI:         { label: 'Multimodal',     color: '#0891B2', bg: 'rgba(8,145,178,0.08)',  border: 'rgba(8,145,178,0.18)'  },
  REAL_WORLD_DEPLOYMENT: { label: 'Real-World',     color: '#E83C00', bg: 'rgba(232,60,0,0.08)',   border: 'rgba(232,60,0,0.18)'   },
}

const FILTER_LABELS: Record<FilterStatus, string> = {
  ALL: 'All', PENDING: 'Pending', UNDER_REVIEW: 'In Review', APPROVED: 'Approved', REJECTED: 'Rejected'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ teamName, onConfirm, onCancel }: {
  teamName: string; onConfirm: (r: string) => void; onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 8 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}
      >
        <div className="px-6 pt-6 pb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.18)' }}>
            <XCircle size={20} style={{ color: '#DC2626' }} />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">Reject Application</h3>
          <p className="text-sm text-slate-500 mb-5">
            Rejecting <span className="font-semibold text-slate-800">{teamName}</span>.
            This reason will be visible to the team.
          </p>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (required)…"
            className="w-full h-28 text-sm placeholder:text-slate-400 rounded-xl px-4 py-3 outline-none resize-none mb-5 transition-all"
            style={{ border: '1.5px solid #E2E8F0', background: '#FAFAFA', color: '#0F172A',
              fontFamily: 'inherit' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; e.currentTarget.style.background = '#fff' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA' }}
            autoFocus
          />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: '1px solid #E2E8F0', color: '#64748B', background: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >Cancel</button>
          <button
            disabled={!reason.trim()} onClick={() => onConfirm(reason)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              boxShadow: reason.trim() ? '0 4px 14px rgba(220,38,38,0.35)' : 'none' }}
          >Confirm Rejection</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Application Row ───────────────────────────────────────────────────────────
function ApplicationRow({ app, index, onApprove, onReject }: {
  app: Application; index: number; onApprove: () => void; onReject: () => void
}) {
  const [open, setOpen] = useState(false)
  const status = STATUS_CONFIG[app.status]
  const track  = TRACK_CONFIG[app.track] ?? TRACK_CONFIG.VOICE_AI_AGENT

  return (
    <motion.div variants={itemVariants} layout
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#FFFFFF',
        border: open ? '1.5px solid rgba(232,60,0,0.25)' : '1.5px solid #EEF2F7',
        boxShadow: open ? '0 8px 32px rgba(232,60,0,0.07)' : '0 1px 4px rgba(15,23,42,0.04)',
      }}
    >
      {/* Collapsed Row */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
        style={{ background: open ? 'rgba(232,60,0,0.015)' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#FAFBFC' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Index */}
        <span className="text-xs font-black w-6 text-center shrink-0" style={{ color: '#CBD5E1' }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={app.teamName} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#0F172A' }}>{app.teamName}</p>
            <p className="text-xs text-slate-400 truncate">{app.projectTitle}</p>
          </div>
        </div>

        {/* Track */}
        <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
          style={{ background: track.bg, color: track.color, border: `1px solid ${track.border}` }}
        >{track.label}</span>

        {/* Members */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0">
          <Users size={11} />
          <span>{app.members.length}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
          style={{ background: status.bg, border: `1px solid ${status.border}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
          <span className="text-[10px] font-bold" style={{ color: status.color }}>{status.label}</span>
        </div>

        {/* Chevron */}
        <div className="shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', color: open ? '#E83C00' : '#CBD5E1' }}>
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-6 space-y-5" style={{ borderTop: '1.5px solid #F1F5F9' }}>

              {/* Section Header */}
              <div className="flex items-center gap-2 pt-4">
                <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: '#E83C00' }}>
                  Participants ({app.members.length})
                </span>
              </div>

              {/* Members Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #F1F5F9' }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400"
                  style={{ background: '#F8FAFC' }}>
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-2">LinkedIn</div>
                  <div className="col-span-1 text-right">GitHub</div>
                </div>
                {app.members.map((member, i) => (
                  <div key={member.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors"
                    style={{ borderTop: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FDFEFE' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FDFEFE')}
                  >
                    <div className="col-span-1 text-center">
                      <span className="text-xs font-black" style={{ color: i === 0 ? '#E83C00' : '#CBD5E1' }}>{i + 1}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <Avatar name={member.name} size="xs" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-900">{member.name}</p>
                        {i === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#E83C00' }}>Lead</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <a href={`mailto:${member.email}`}
                        className="text-[11px] text-slate-500 hover:text-slate-800 truncate flex items-center gap-1 transition-colors">
                        <Mail size={9} className="shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    </div>
                    <div className="col-span-2">
                      {member.phone
                        ? <a href={`tel:${member.phone}`} className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                            <Phone size={9} className="shrink-0" /><span>{member.phone}</span>
                          </a>
                        : <span className="text-[11px] text-slate-300">—</span>
                      }
                    </div>
                    <div className="col-span-2 min-w-0">
                      {member.linkedin
                        ? <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-blue-500 hover:underline truncate block">
                            {member.linkedin.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                          </a>
                        : <span className="text-[11px] text-slate-300">—</span>
                      }
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {member.github && (
                        <a href={member.github} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border transition-all flex items-center justify-center hover:scale-105"
                          style={{ color: '#24292F', borderColor: 'rgba(36,41,47,0.25)', background: 'rgba(36,41,47,0.04)' }}>
                          <Github size={13} strokeWidth={2.5} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Section */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black mb-3 flex items-center gap-1.5" style={{ color: '#E83C00' }}>
                  <Lightbulb size={11} /> Project
                </p>
                <div className="space-y-3 rounded-xl p-4" style={{ background: '#F8FAFC', border: '1.5px solid #EEF2F7' }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Title</p>
                    <p className="text-sm font-bold text-slate-900">{app.projectTitle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Description</p>
                    <p className="text-xs leading-relaxed text-slate-600">{app.projectDescription}</p>
                  </div>
                  {app.voiceExperience && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Mic size={9} /> Experience
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600">{app.voiceExperience}</p>
                    </div>
                  )}
                  {app.techStack && app.techStack.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1">
                        <Code2 size={9} /> Stack
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {app.techStack.map(t => (
                          <span key={t} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(232,60,0,0.08)', color: '#E83C00', border: '1px solid rgba(232,60,0,0.18)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection reason */}
              {app.status === 'REJECTED' && app.rejectionReason && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.14)' }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#DC2626' }}>Rejection Reason</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7f1d1d' }}>{app.rejectionReason}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1"
                style={{ borderTop: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar size={11} /> {timeAgo(app.submittedAt)}</span>
                  {app.reviewedAt && <span className="flex items-center gap-1.5"><BadgeCheck size={11} /> Reviewed {timeAgo(app.reviewedAt)}</span>}
                </div>

                {(app.status === 'PENDING' || app.status === 'UNDER_REVIEW') && (
                  <div className="flex gap-2">
                    <button onClick={onReject}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ color: '#DC2626', border: '1.5px solid rgba(220,38,38,0.22)', background: 'rgba(220,38,38,0.05)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.10)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.05)')}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                    <button onClick={onApprove}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#E83C00,#FF5A1F)', boxShadow: '0 4px 14px rgba(232,60,0,0.32)' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                  </div>
                )}
                {app.status === 'APPROVED' && (
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle size={12} /> Approved {app.reviewedAt ? timeAgo(app.reviewedAt) : ''}
                  </span>
                )}
                {app.status === 'REJECTED' && (
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-red-500">
                    <XCircle size={12} /> Rejected {app.reviewedAt ? timeAgo(app.reviewedAt) : ''}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [applications, setApplications] = useState<Application[]>([])
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchApps() }, [])

  const fetchApps = async () => {
    try {
      setLoading(true)
      const res = await api.applications.list({ limit: 100 })
      if (res.data?.success) {
        const mapped: Application[] = res.data.data.items.map((app: any) => ({
          id: app.id,
          teamName: app.teamName,
          projectTitle: app.projectTitle,
          projectDescription: app.projectDescription,
          voiceExperience: app.experience,
          techStack: app.techStack || [],
          track: app.track?.slug === 'real-world-deployment' ? 'REAL_WORLD_DEPLOYMENT'
               : app.track?.slug === 'multimodal-ai' ? 'MULTIMODAL_AI' : 'VOICE_AI_AGENT',
          members: (app.teamMembers || []).map((m: any) => ({
            id: m.id, name: m.name, email: m.email, phone: m.phone,
            role: m.role, linkedin: m.linkedin, github: m.github
          })),
          status: app.status,
          submittedAt: app.createdAt,
          reviewedAt: app.approvalTimestamp || undefined,
          rejectionReason: app.rejectionReason || undefined,
        }))
        setApplications(mapped)
      }
    } catch (err) {
      console.error('Failed to load applications', err)
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id: string) => {
    try {
      await api.applications.approve(id)
      setApplications(p => p.map(a => a.id === id ? { ...a, status: 'APPROVED', reviewedAt: new Date().toISOString() } : a))
    } catch (err) { console.error('Failed to approve', err) }
  }

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.applications.reject(id, reason)
      setApplications(p => p.map(a => a.id === id
        ? { ...a, status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date().toISOString() } : a))
      setRejectTarget(null)
    } catch (err) { console.error('Failed to reject', err) }
  }

  const counts: Record<FilterStatus, number> = {
    ALL:          applications.length,
    PENDING:      applications.filter(a => a.status === 'PENDING').length,
    UNDER_REVIEW: applications.filter(a => a.status === 'UNDER_REVIEW').length,
    APPROVED:     applications.filter(a => a.status === 'APPROVED').length,
    REJECTED:     applications.filter(a => a.status === 'REJECTED').length,
  }

  const filtered = applications.filter(app => {
    const q = search.toLowerCase()
    const matchSearch =
      app.teamName.toLowerCase().includes(q) ||
      app.projectTitle.toLowerCase().includes(q) ||
      app.members.some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    return matchSearch && (filter === 'ALL' || app.status === filter)
  })

  const totalParticipants = applications.reduce((s, a) => s + a.members.length, 0)

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1200px] space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applications</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review, approve, or reject hackathon team applications.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: FileText, label: 'Applications', value: applications.length },
              { icon: Users, label: 'Participants', value: totalParticipants },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white"
                style={{ border: '1.5px solid #EEF2F7' }}>
                <Icon size={14} style={{ color: '#E83C00' }} />
                <span className="text-sm font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by team, participant, email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl outline-none transition-all"
              style={{ border: '1.5px solid #EEF2F7', color: '#0F172A' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,60,0,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EEF2F7')}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  background: filter === f ? 'rgba(232,60,0,0.08)' : '#FFFFFF',
                  color: filter === f ? '#E83C00' : '#64748B',
                  borderColor: filter === f ? 'rgba(232,60,0,0.28)' : '#EEF2F7',
                  boxShadow: filter === f ? '0 2px 8px rgba(232,60,0,0.10)' : 'none',
                }}
              >
                {FILTER_LABELS[f]} <span className="ml-1 opacity-50">({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Column Headers ── */}
        <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-slate-400"
          style={{ background: '#F8FAFC', border: '1.5px solid #EEF2F7' }}>
          <span className="w-6 text-center shrink-0">#</span>
          <span className="flex-1">Team / Project</span>
          <span className="hidden md:block w-32 shrink-0">Track</span>
          <span className="hidden sm:block w-10 shrink-0">Mbrs</span>
          <span className="w-24 shrink-0">Status</span>
          <span className="w-4 shrink-0" />
        </div>

        {/* ── Rows ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#E83C00] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-400">Loading applications…</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((app, i) => (
              <ApplicationRow key={app.id} app={app} index={i}
                onApprove={() => approve(app.id)}
                onReject={() => setRejectTarget(app.id)}
              />
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#F8FAFC', border: '1.5px solid #EEF2F7' }}>
                <FileText size={28} style={{ color: '#CBD5E1' }} />
              </div>
              <p className="text-sm font-semibold text-slate-400">No applications found</p>
              <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>

      </div>

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            teamName={applications.find(a => a.id === rejectTarget)?.teamName ?? ''}
            onConfirm={reason => handleReject(rejectTarget, reason)}
            onCancel={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
