import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { QrCode, Search, CheckCircle2, User, Users, MapPin, Award, RefreshCw, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface TeamData {
  id: string
  name: string
  tableNumber?: string
  bonusPoints: number
  attendanceStatus: string
  track: { name: string }
  members: {
    id: string
    name: string
    role?: string
    email: string
    phone?: string
    isPresent: boolean
    checkedInAt?: string
  }[]
}

export function AdminScannerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [scannedMemberId, setScannedMemberId] = useState<string | null>(null)
  
  // Bonus point task states for on-spot verification
  const [socialTasks, setSocialTasks] = useState({
    instaSnapserve: true,
    instaVobiz: true,
    linkedinVobiz: true,
    linkedinSnapserve: true,
    linkedinVoiceBuilder: true
  })
  const [updatingBonus, setUpdatingBonus] = useState(false)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

  const handleLookup = async (query: string) => {
    if (!query.trim()) return
    try {
      setLoading(true)
      const res = await api.attendance.lookup(query.trim())
      if (res.data) {
        setTeamData(res.data.team)
        setScannedMemberId(res.data.scannedMemberId)
        
        // Preset social task checkboxes based on team bonus points count
        const pts = res.data.team.bonusPoints || 0
        setSocialTasks({
          instaSnapserve: pts >= 2,
          instaVobiz: pts >= 4,
          linkedinVobiz: pts >= 6,
          linkedinSnapserve: pts >= 8,
          linkedinVoiceBuilder: pts >= 10
        })
        toast.success(`Found Team "${res.data.team.name}"!`)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || `No participant or team found for "${query}"`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMemberAttendance = async (memberId: string, currentStatus: boolean) => {
    try {
      setCheckingInId(memberId)
      const newStatus = !currentStatus
      await api.attendance.checkIn(memberId, newStatus)
      
      // Update local state
      if (teamData) {
        setTeamData({
          ...teamData,
          attendanceStatus: 'CHECKED_IN',
          members: teamData.members.map(m =>
            m.id === memberId
              ? { ...m, isPresent: newStatus, checkedInAt: newStatus ? new Date().toISOString() : undefined }
              : m
          )
        })
      }
      toast.success(newStatus ? 'Marked Present & Checked-In! ✅' : 'Attendance Status Reset')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update attendance status.')
    } finally {
      setCheckingInId(null)
    }
  }

  const calculatedBonusPts = Object.values(socialTasks).filter(Boolean).length * 2

  const handleSaveBonusPoints = async () => {
    if (!teamData) return
    try {
      setUpdatingBonus(true)
      await api.attendance.verifyBonus(teamData.id, calculatedBonusPts)
      setTeamData({ ...teamData, bonusPoints: calculatedBonusPts })
      toast.success(`Awarded +${calculatedBonusPts} Bonus Points! Leaderboard updated 🏆`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update bonus points.')
    } finally {
      setUpdatingBonus(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-orange-100 text-[#E83C00] text-[10px] font-black uppercase tracking-wider rounded-md">
                Fast-Pass Attendance Scanner
              </span>
              <span className="text-[10px] font-bold text-slate-400">QR &amp; On-Spot Verifier</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Desk Check-In &amp; Bonus Scanner</h1>
            <p className="text-xs text-slate-500 mt-1">Scan participant Lanyard Pass QR or lookup by Team Name / Table Number to verify attendance and award bonus points on the spot!</p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#12141A] text-[#D4AF37] flex items-center justify-center shrink-0 border border-slate-800 shadow-md">
            <QrCode size={24} />
          </div>
        </div>

        {/* ── Scanner / Search Input Box ── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            Scan QR Code or Search Team / Participant
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLookup(searchQuery)
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan QR or type Team Name (e.g. SnapServe AI), Table Number (T-01), or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E83C00]/20 focus:border-[#E83C00] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#E83C00] hover:bg-[#FF4500] text-white text-xs font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Verify &amp; Lookup</span>
            </button>
          </form>

          {/* Quick Preset Buttons for Live Testing */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Search:</span>
            {['SnapServe AI', 'Table T-01', 'Healthcare Voice AI'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSearchQuery(preset)
                  handleLookup(preset)
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-[#E83C00] text-slate-600 text-[10px] font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scan Result Modal / Verification Card ── */}
        {teamData && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#12141A] via-slate-900 to-[#12141A] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-[#E83C00] text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                    {teamData.track?.name || 'Voice AI Track'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-widest rounded-md font-mono">
                    {teamData.tableNumber || 'TABLE T-01'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{teamData.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Total Members: {teamData.members.length} Participants</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border ${
                  teamData.attendanceStatus === 'CHECKED_IN'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {teamData.attendanceStatus === 'CHECKED_IN' ? '✅ CHECKED IN' : '⏳ CHECK-IN PENDING'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* 1. MEMBERS ATTENDANCE CHECK-IN SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-[#E83C00]" />
                    <span>Team Members Attendance ({teamData.members.filter(m => m.isPresent).length} / {teamData.members.length} Present)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Tap button to check in member</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamData.members.map((member) => {
                    const isTarget = scannedMemberId === member.id
                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          member.isPresent
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isTarget
                            ? 'bg-orange-50/80 border-[#E83C00] ring-2 ring-[#E83C00]/20'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block">
                              {member.role || 'Team Member'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate">{member.email}</p>
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase border ${
                            member.isPresent
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}>
                            {member.isPresent ? 'PRESENT' : 'NOT CHECKED'}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={checkingInId === member.id}
                          onClick={() => handleToggleMemberAttendance(member.id, member.isPresent)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                            member.isPresent
                              ? 'bg-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>{member.isPresent ? 'Cancel / Undo Check-In' : 'Mark Present & Check-In'}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full" />

              {/* 2. ON-THE-SPOT BONUS POINTS VERIFIER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>On-The-Spot Bonus Points Verifier</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Verify participant's social task completions on their mobile phone screen &amp; award bonus points!</p>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 text-center shrink-0">
                    <span className="text-[9px] font-bold text-amber-700 uppercase block">Total Bonus</span>
                    <span className="text-xl font-black text-[#E83C00] font-mono">+{calculatedBonusPts} <span className="text-xs font-bold text-amber-600">/ 10 Pts</span></span>
                  </div>
                </div>

                {/* Social Channels Checklist */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {[
                    { key: 'instaSnapserve', label: 'Followed Instagram (@snapserve_ai)', pts: 2 },
                    { key: 'instaVobiz', label: 'Followed Instagram (@vobiz_ai)', pts: 2 },
                    { key: 'linkedinVobiz', label: 'Followed LinkedIn (Vobiz AI)', pts: 2 },
                    { key: 'linkedinSnapserve', label: 'Followed LinkedIn (SnapServe.ai)', pts: 2 },
                    { key: 'linkedinVoiceBuilder', label: 'Joined LinkedIn Voice Builder Community', pts: 2 },
                  ].map((task) => {
                    const checked = (socialTasks as any)[task.key]
                    return (
                      <label
                        key={task.key}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          checked
                            ? 'bg-amber-50/90 border-amber-300 text-slate-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setSocialTasks({ ...socialTasks, [task.key]: e.target.checked })
                            }
                            className="w-4 h-4 text-[#E83C00] rounded focus:ring-[#E83C00] border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-bold">{task.label}</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-[#E83C00]">+{task.pts} Pts</span>
                      </label>
                    )
                  })}
                </div>

                {/* Save & Award Button */}
                <button
                  type="button"
                  disabled={updatingBonus}
                  onClick={handleSaveBonusPoints}
                  className="w-full py-3.5 bg-gradient-to-r from-[#E83C00] to-orange-600 hover:from-[#FF4500] hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingBonus ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>Save &amp; Update Live Leaderboard (+{calculatedBonusPts} Pts)</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
