import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Save, Calendar, MapPin, Link, Users, Clock } from 'lucide-react'

export function SettingsPage() {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[900px] space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm text-slate-400">Configure SnapServe platform settings.</p>
        </div>

        {/* Event Info (SnapServe Identity) */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
          <h3 className="font-display font-bold text-white border-b border-white/10 pb-2">Event Information</h3>
          <Input label="Hackathon Name" defaultValue="AI Voice Agent Hackathon 2026" />
          <Input label="Tagline" defaultValue="Build the Future of Voice AI" />
          <Textarea label="Description" defaultValue="India's most competitive AI Voice Agent Hackathon. Over 48 intense hours, teams design, build, and deploy voice AI agents." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="datetime-local" defaultValue="2026-08-15T09:00" leftIcon={<Calendar size={15} />} />
            <Input label="End Date" type="datetime-local" defaultValue="2026-08-17T18:00" leftIcon={<Calendar size={15} />} />
          </div>
          <Input label="Registration Deadline" type="datetime-local" defaultValue="2026-08-10T23:59" leftIcon={<Clock size={15} />} />
          <Input label="Venue" defaultValue="The Aitel HQ, Chennai, India" leftIcon={<MapPin size={15} />} />
          <Input label="Luma Event URL" defaultValue="https://lu.ma/ai-voice-hackathon-2026" leftIcon={<Link size={15} />} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Teams" type="number" defaultValue="50" leftIcon={<Users size={15} />} />
            <Input label="Max Team Size" type="number" defaultValue="4" leftIcon={<Users size={15} />} />
          </div>
        </div>

        {/* Registration Control (SnapServe Rules) */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="font-display font-bold text-white border-b border-white/10 pb-2">Registration Controls</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Registration Open</p>
              <p className="text-xs text-slate-400 mt-0.5">Allow new teams to register via Luma</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-[#5B5CEB] transition-all peer-checked:after:translate-x-5 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Public Leaderboard</p>
              <p className="text-xs text-slate-400 mt-0.5">Show leaderboard to public visitors</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-[#5B5CEB] transition-all peer-checked:after:translate-x-5 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </div>

        {/* SnapServe standard Indigo trigger */}
        <Button loading={saving} onClick={handleSave} size="lg" glow leftIcon={<Save size={18} />} className="bg-[#5B5CEB] hover:bg-[#4a4bcf]">
          Save Settings
        </Button>
      </div>
    </DashboardLayout>
  )
}
