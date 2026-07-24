import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { containerVariants, itemVariants } from '@/lib/motion'
import { Mail, Send, Eye, FileText, CheckCircle, XCircle, Bell, Award, RefreshCw } from 'lucide-react'

const templates = [
  { id: 'REGISTRATION_RECEIVED', label: 'Registration Received', icon: FileText, color: 'primary' },
  { id: 'APPLICATION_APPROVED', label: 'Application Approved', icon: CheckCircle, color: 'success' },
  { id: 'APPLICATION_REJECTED', label: 'Application Rejected', icon: XCircle, color: 'danger' },
  { id: 'REMINDER', label: 'Reminder', icon: Bell, color: 'warning' },
  { id: 'WINNER_ANNOUNCEMENT', label: 'Winner Announcement', icon: Award, color: 'accent' },
]

const emailLogs = [
  { id: '1', to: 'voiceforge@iitm.ac.in', subject: 'Application Received — AI Voice Hackathon', template: 'REGISTRATION_RECEIVED', status: 'SENT', sentAt: '2026-07-23 10:34' },
  { id: '2', to: 'speaksense@bits.ac.in', subject: 'Congratulations! Application Approved', template: 'APPLICATION_APPROVED', status: 'SENT', sentAt: '2026-07-23 09:12' },
  { id: '3', to: 'echobot@srm.edu.in', subject: 'Application Update — AI Voice Hackathon', template: 'APPLICATION_REJECTED', status: 'FAILED', sentAt: '2026-07-23 08:45' },
]

const statusColors: Record<string, string> = {
  SENT: 'success',
  FAILED: 'danger',
  QUEUED: 'warning',
  BOUNCED: 'danger',
}

export function EmailsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 1500))
    setSending(false)
    setTo('')
    setSubject('')
    setBody('')
    setSelectedTemplate(null)
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Emails</h1>
          <p className="text-sm text-slate-500">Send emails to teams using professional templates</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Composer */}
          <div className="lg:col-span-2 space-y-5">
            {/* Template picker */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <h3 className="font-display font-semibold text-slate-900 mb-4">Choose Template</h3>
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map(t => {
                  const Icon = t.icon
                  const isSelected = selectedTemplate === t.id
                  const colorMap: Record<string, string> = {
                    primary: 'bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/20',
                    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    danger: 'bg-red-50 text-red-600 border-red-100',
                    warning: 'bg-amber-50 text-amber-600 border-amber-100',
                    accent: 'bg-cyan-50 text-cyan-600 border-cyan-100',
                  }
                  return (
                    <motion.button
                      key={t.id}
                      variants={itemVariants}
                      onClick={() => setSelectedTemplate(isSelected ? null : t.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected ? 'border-[#5B5CEB] bg-[#5B5CEB]/10 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center border ${colorMap[t.color]}`}>
                        <Icon size={16} />
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{t.label}</p>
                    </motion.button>
                  )
                })}
              </motion.div>
            </div>

            {/* Compose form */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900">Compose</h3>
              <Input
                label="To"
                placeholder="email@example.com or team name"
                value={to}
                onChange={e => setTo(e.target.value)}
                leftIcon={<Mail size={15} />}
              />
              <Input
                label="Subject"
                placeholder="Email subject…"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <Textarea
                label="Message"
                placeholder="Email body (HTML is supported)…"
                value={body}
                onChange={e => setBody(e.target.value)}
                className="min-h-[180px]"
              />
              <div className="flex gap-3">
                <Button variant="outline" size="sm" leftIcon={<Eye size={15} />}>Preview</Button>
                <Button size="sm" loading={sending} leftIcon={<Send size={15} />} onClick={handleSend} fullWidth className="bg-[#5B5CEB] hover:bg-[#4a4bcf]">
                  Send Email
                </Button>
              </div>
            </div>
          </div>

          {/* Email Logs */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl h-fit shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-display font-semibold text-slate-900">Email Logs</h3>
              <button className="text-slate-400 hover:text-slate-700 transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {emailLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{log.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">{log.to}</p>
                    </div>
                    <Badge variant={statusColors[log.status] as any} size="sm">{log.status}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono font-medium">{log.sentAt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
