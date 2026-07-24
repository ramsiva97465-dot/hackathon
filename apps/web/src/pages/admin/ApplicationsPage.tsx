import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Eye, CheckCircle, XCircle, MessageSquare, ExternalLink, Github, Linkedin, FileText, Users, Building, Briefcase, User } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { containerVariants, itemVariants } from '@/lib/motion'
import { getStatusConfig, getTrackConfig } from '@/lib/utils'
import type { Application } from '@hackathon/shared'

// Mock data
const mockApplications: Application[] = [
  {
    id: '1',
    teamName: 'VoiceForge AI',
    type: 'TEAM',
    city: 'Chennai',
    projectTitle: 'Empathetic Voice Agent for Mental Health',
    projectDescription: 'An AI voice agent that provides mental health support using empathetic conversation, real-time sentiment analysis, and crisis detection.',
    track: 'VOICE_AI_AGENT',
    members: [
      { id: '1', name: 'Ananya Kumar', email: 'ananya@iitm.ac.in', role: 'Team Lead', linkedin: '#', github: '#', portfolio: '#' },
      { id: '2', name: 'Rohan Patel', email: 'rohan@iitm.ac.in', role: 'ML Engineer', linkedin: '#', github: '#' },
      { id: '3', name: 'Sneha Raj', email: 'sneha@iitm.ac.in', role: 'Backend Dev', github: '#' },
    ],
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    teamName: 'SpeakSense',
    type: 'TEAM',
    city: 'Pilani',
    projectTitle: 'Multilingual Voice Commerce Agent',
    projectDescription: 'A voice-first commerce agent supporting 12 Indic languages for rural market accessibility.',
    track: 'REAL_WORLD_DEPLOYMENT',
    members: [
      { id: '4', name: 'Arjun Singh', email: 'arjun@bits.ac.in', role: 'Team Lead', linkedin: '#', github: '#' },
      { id: '5', name: 'Priya Nair', email: 'priya@bits.ac.in', role: 'AI Researcher', linkedin: '#' },
    ],
    status: 'APPROVED',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    reviewedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    teamName: 'Siva (Individual)',
    type: 'INDIVIDUAL',
    city: 'Tiruchirappalli',
    projectTitle: 'Multimodal AI Teaching Assistant',
    projectDescription: 'An AI tutor that combines voice, vision, and text to provide personalized 1:1 tutoring experiences.',
    track: 'MULTIMODAL_AI',
    members: [
      { id: '6', name: 'Siva', email: 'siva@nitt.edu', role: 'Team Lead', github: '#' }
    ],
    status: 'UNDER_REVIEW',
    submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

type FilterStatus = 'ALL' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

interface RejectModalProps {
  teamName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function RejectModal({ teamName, onConfirm, onCancel }: RejectModalProps) {
  const [reason, setReason] = useState('')
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl shadow-xl"
      >
        <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Reject Application</h3>
        <p className="text-sm text-slate-600 mb-4">You are rejecting <span className="text-[#5B5CEB] font-bold">{teamName}</span>. Please provide a reason — this will be included in their rejection email.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection (required)…"
          className="w-full h-32 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 rounded-xl px-4 py-3 border border-slate-200 focus:border-red-500 outline-none resize-none mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger" fullWidth disabled={!reason.trim()} onClick={() => onConfirm(reason)}>
            Confirm Rejection
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ApplicationCard({ app, onApprove, onReject, onReview }: {
  app: Application
  onApprove: () => void
  onReject: () => void
  onReview: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = getStatusConfig(app.status)
  const track = getTrackConfig(app.track)

  return (
    <motion.div layout className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-[#5B5CEB]/30 hover:shadow-sm transition-all duration-300">
      {/* Card header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Avatar name={app.teamName} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-bold text-slate-900 text-base">{app.teamName}</h3>
              <span className={`chip text-[10px] px-2 py-0.5`} style={{ background: track.bg, color: track.color }}>
                {track.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                {app.type === 'TEAM' ? (
                  <>
                    <Users size={11} />
                    Team
                  </>
                ) : (
                  <>
                    <User size={11} />
                    Individual
                  </>
                )}
              </span>
              <span className="flex items-center gap-1"><Users size={11} />{app.members.length} members</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                • {app.type || 'INDIVIDUAL'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{app.projectTitle}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <Badge variant={status.className.includes('approved') ? 'success' : status.className.includes('rejected') ? 'danger' : status.className.includes('review') ? 'primary' : 'warning'} dot size="sm">
            {status.label}
          </Badge>
          <AvatarGroup users={app.members} size="xs" max={3} />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-100 px-5 pb-5 pt-4"
          >
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{app.projectDescription}</p>
            {/* Members */}
            <div className="space-y-2">
              {app.members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member.name} size="xs" />
                    <div>
                      <p className="text-sm text-slate-800 font-semibold">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#5B5CEB] hover:bg-[#5B5CEB]/10 transition-all"><Linkedin size={12} /></a>}
                    {member.github && <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"><Github size={12} /></a>}
                    {member.portfolio && <a href={member.portfolio} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"><ExternalLink size={12} /></a>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="px-5 pb-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Eye size={13} />
          {expanded ? 'Hide details' : 'View details'}
        </button>

        {app.status === 'PENDING' || app.status === 'UNDER_REVIEW' ? (
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" leftIcon={<MessageSquare size={13} />} onClick={onReview}>
              Request Changes
            </Button>
            <Button size="xs" variant="danger" leftIcon={<XCircle size={13} />} onClick={onReject}>
              Reject
            </Button>
            <Button size="xs" variant="success" leftIcon={<CheckCircle size={13} />} onClick={onApprove}>
              Approve
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted">
            {app.reviewedAt ? `Reviewed ${new Date(app.reviewedAt).toLocaleDateString()}` : ''}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [applications, setApplications] = useState(mockApplications)

  const filtered = applications.filter(app => {
    const matchSearch = app.teamName.toLowerCase().includes(search.toLowerCase()) ||
      app.college.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || app.status === filter
    return matchSearch && matchFilter
  })

  const approve = (id: string) => setApplications(p => p.map(a => a.id === id ? { ...a, status: 'APPROVED' as const, reviewedAt: new Date().toISOString() } : a))
  const reject = (id: string, _reason: string) => {
    setApplications(p => p.map(a => a.id === id ? { ...a, status: 'REJECTED' as const, rejectionReason: _reason, reviewedAt: new Date().toISOString() } : a))
    setRejectTarget(null)
  }

  const filterCounts: Record<FilterStatus, number> = {
    ALL: applications.length,
    PENDING: applications.filter(a => a.status === 'PENDING').length,
    UNDER_REVIEW: applications.filter(a => a.status === 'UNDER_REVIEW').length,
    APPROVED: applications.filter(a => a.status === 'APPROVED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Applications</h1>
          <p className="text-sm text-slate-500">Review and manage hackathon applications</p>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by team name or college…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            containerClassName="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  filter === f
                    ? 'bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/30 shadow-sm'
                    : 'text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {f.replace('_', ' ')} ({filterCounts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Applications grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-4"
        >
          {filtered.map(app => (
            <motion.div key={app.id} variants={itemVariants} layout>
              <ApplicationCard
                app={app}
                onApprove={() => approve(app.id)}
                onReject={() => setRejectTarget(app.id)}
                onReview={() => {}}
              />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-20 text-center text-muted">
              <FileText size={40} className="mx-auto mb-4 opacity-30" />
              <p>No applications found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            teamName={applications.find(a => a.id === rejectTarget)?.teamName ?? ''}
            onConfirm={reason => reject(rejectTarget, reason)}
            onCancel={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
