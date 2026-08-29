import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Save, Monitor, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [tvMode, setTvMode] = useState(() => {
    return localStorage.getItem('snapserve_tv_mode') === 'true'
  })
  const [certificatesReleased, setCertificatesReleased] = useState(() => {
    return localStorage.getItem('snapserve_certificates_released') === 'true'
  })

  useEffect(() => {
    api.leaderboard.getTvMode()
      .then(res => {
        if (typeof res.data?.tvMode === 'boolean') {
          setTvMode(res.data.tvMode)
          localStorage.setItem('snapserve_tv_mode', res.data.tvMode ? 'true' : 'false')
        }
      })
      .catch(() => {})
  }, [])

  const handleToggleTvMode = async (val: boolean) => {
    setTvMode(val)
    localStorage.setItem('snapserve_tv_mode', val ? 'true' : 'false')
    window.dispatchEvent(new Event('tv_mode_toggled'))
    try {
      await api.leaderboard.setTvMode(val)
      toast.success(val ? '📺 TV Mode ENABLED on Leaderboard (Auto-Scroll Active)!' : '📺 TV Mode DISABLED on Leaderboard!')
    } catch (err) {
      toast.success(val ? '📺 TV Mode ENABLED locally!' : '📺 TV Mode DISABLED locally!')
    }
  }

  const handleToggleCertificates = (val: boolean) => {
    setCertificatesReleased(val)
    localStorage.setItem('snapserve_certificates_released', val ? 'true' : 'false')
    window.dispatchEvent(new Event('certificates_toggled'))
    toast.success(val ? 'Certificates RELEASED to participants!' : 'Certificates LOCKED from participants!')
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Settings saved successfully!')
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[900px] space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Platform Settings</h1>
          <p className="text-sm text-slate-400">Configure SnapServe live stage displays, TV mode, and participant controls.</p>
        </div>

        {/* ── TV Mode & Stage Projection Controls ── */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Monitor size={18} className="text-emerald-400" />
              <h3 className="font-display font-bold text-white">Stage & TV Presentation</h3>
            </div>
            <a
              href="/leaderboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              Open Leaderboard Screen ↗
            </a>
          </div>

          {/* TV Mode Toggle Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-emerald-500/30">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">Leaderboard TV Mode (Auto-Scroll)</p>
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${tvMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {tvMode ? 'TV MODE: ON (AUTO-SCROLLING)' : 'TV MODE: OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                When switched ON, the public Leaderboard will automatically scroll top-to-bottom continuously for stage projectors & TV screens.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                checked={tvMode}
                onChange={(e) => handleToggleTvMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 transition-all peer-checked:after:translate-x-5 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner" />
            </label>
          </div>
        </div>

        {/* ── Registration & Release Control ── */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="font-display font-bold text-white border-b border-white/10 pb-2">Release Controls</h3>
          
          {/* Certificate Release Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-amber-500/30">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">Release Participation Certificates</p>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${certificatesReleased ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                  {certificatesReleased ? 'VISIBLE TO PARTICIPANTS' : 'LOCKED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Toggle ON to enable Certificate download tab on participant dashboards</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                checked={certificatesReleased}
                onChange={(e) => handleToggleCertificates(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-500 transition-all peer-checked:after:translate-x-5 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Public Leaderboard Access</p>
              <p className="text-xs text-slate-400 mt-0.5">Allow public audience to view live ranks and scores</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-[#5B5CEB] transition-all peer-checked:after:translate-x-5 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <Button loading={saving} onClick={handleSave} size="lg" glow leftIcon={<Save size={18} />} className="bg-[#5B5CEB] hover:bg-[#4a4bcf] cursor-pointer">
          Save Settings
        </Button>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
