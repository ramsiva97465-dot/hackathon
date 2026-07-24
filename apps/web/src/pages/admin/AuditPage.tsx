import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ScrollText, User, Settings, Shield, Eye, ArrowRight } from 'lucide-react'

const logs = [
  { id: '1', user: 'Admin User', action: 'Application Approved', entity: 'SpeakSense', time: '2026-07-23 10:45', type: 'success' },
  { id: '2', user: 'Admin User', action: 'Application Rejected', entity: 'EchoBot Labs', time: '2026-07-23 10:30', type: 'danger' },
  { id: '3', user: 'Judge Priya', action: 'Score Submitted', entity: 'AudioMind', time: '2026-07-23 10:15', type: 'primary' },
  { id: '4', user: 'Admin User', action: 'Judge Assigned', entity: 'NovaTalk → Priya Rajan', time: '2026-07-23 09:58', type: 'accent' },
  { id: '5', user: 'Judge Arjun', action: 'Score Submitted', entity: 'SpeakSense', time: '2026-07-23 09:40', type: 'primary' },
  { id: '6', user: 'Admin User', action: 'Email Sent', entity: 'SpeakSense — Approval', time: '2026-07-23 09:35', type: 'success' },
  { id: '7', user: 'Admin User', action: 'Settings Updated', entity: 'Event Config', time: '2026-07-23 08:00', type: 'muted' },
]

const typeColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-150',
  danger: 'bg-red-50 text-red-700 border-red-150',
  primary: 'bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/15',
  accent: 'bg-cyan-50 text-cyan-700 border-cyan-150',
  muted: 'bg-slate-50 text-slate-500 border-slate-200',
}

export function AuditPage() {
  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Audit Logs</h1>
          <p className="text-sm text-slate-500">Full history of all admin and judge actions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <ScrollText size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 font-semibold">{logs.length} recent events</span>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <Avatar name={log.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{log.user}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${typeColors[log.type]}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                    <ArrowRight size={10} className="text-slate-400" />
                    {log.entity}
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium font-mono shrink-0 hidden md:block">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
