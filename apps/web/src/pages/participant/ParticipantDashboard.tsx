import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Trophy, Users, Award, ExternalLink,
  Code, LogOut, Save, Star, FileText, CheckCircle
} from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogos'

type TeamDetails = {
  id: string
  name: string
  tableNumber: string | null
  track: { name: string; slug: string }
  projectTitle: string | null
  projectDescription: string | null
  githubUrl: string | null
  demoUrl: string | null
  techStack: string[]
  members: { name: string; email: string; role: string }[]
  evaluation: {
    submittedSheetsCount: number
    overallScore: number | null
    rank: number | null
    criteria: {
      id: string
      name: string
      description: string | null
      maxScore: number
      weight: number
      avgScore: number | null
      comments: string[]
    }[]
  }
}

export function ParticipantDashboard() {
  const [data, setData] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [techStackText, setTechStackText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMyTeam()
  }, [])

  const fetchMyTeam = async () => {
    try {
      setLoading(true)
      const res = await api.teams.myTeam()
      if (res.data?.success) {
        const team = res.data.data
        setData(team)
        setProjectTitle(team.projectTitle || '')
        setProjectDescription(team.projectDescription || '')
        setGithubUrl(team.githubUrl || '')
        setDemoUrl(team.demoUrl || '')
        setTechStackText(team.techStack ? team.techStack.join(', ') : '')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load team data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const techStack = techStackText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const res = await api.teams.submitProject({
        projectTitle,
        projectDescription,
        githubUrl,
        demoUrl,
        techStack,
      })

      if (res.data?.success) {
        toast.success('Project details saved successfully!')
        fetchMyTeam()
      } else {
        toast.error('Failed to save project details.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save project details.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Loading your team portal…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border max-w-sm">
          <p className="text-slate-500 font-semibold mb-4">No team data found.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-orange-600 text-white rounded-xl">Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <BrandLockup tone="light" />
          <span className="text-slate-300">|</span>
          <span className="text-sm font-bold text-slate-800 tracking-tight">Participant Desk</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
        >
          <LogOut size={13} />
          Logout
        </button>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Details & Form) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team Info Card */}
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#E83C00] uppercase tracking-widest">{data.track.name}</span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">{data.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{data.members.length} Members</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Table Number</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">
                  {data.tableNumber || 'TBD'}
                </span>
              </div>
            </div>

            {/* Members List */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Team Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.members.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{m.email}</p>
                    </div>
                    <span className="ml-auto text-[9px] font-semibold bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-md uppercase">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Form Card */}
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="text-[#E83C00]" size={16} />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Project Submission</h2>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project Title</label>
                  <input
                    value={projectTitle}
                    onChange={e => setProjectTitle(e.target.value)}
                    placeholder="e.g. EchoFlow real-time agent"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 outline-none"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Tech Stack (comma separated)</label>
                  <input
                    value={techStackText}
                    onChange={e => setTechStackText(e.target.value)}
                    placeholder="e.g. NestJS, React, ElevenLabs"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 outline-none"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Project Description</label>
                <textarea
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  placeholder="Describe your project, how it works, and the core problems it solves..."
                  rows={4}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 outline-none resize-none"
                  style={{ borderColor: '#E2E8F0' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">GitHub Repository URL</label>
                  <input
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 outline-none"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Demo Video URL</label>
                  <input
                    value={demoUrl}
                    onChange={e => setDemoUrl(e.target.value)}
                    placeholder="https://youtube.com/... or Loom link"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 outline-none"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 text-xs font-bold rounded-xl text-white transition-all bg-[#E83C00] hover:bg-[#c93400] disabled:opacity-50"
              >
                <Save size={13} />
                {saving ? 'Saving Project Details...' : 'Save Submission'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (Evaluation Status & Live Scores) */}
        <div className="space-y-6">
          
          {/* Live Overall Score Widget */}
          <div className="bg-white rounded-2xl border p-5 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#E83C00]" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Status</h3>

            {data.evaluation.submittedSheetsCount > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider mx-auto">
                  <CheckCircle size={11} />
                  Judged by {data.evaluation.submittedSheetsCount} Judges
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Average Score</span>
                  <span className="text-5xl font-black text-slate-900 block tracking-tight">
                    {data.evaluation.overallScore ? data.evaluation.overallScore.toFixed(1) : '—'}
                  </span>
                </div>
                {data.evaluation.rank && (
                  <div className="flex items-center gap-1.5 justify-center text-slate-500 font-semibold text-xs mt-2">
                    <Trophy size={13} className="text-amber-500" />
                    Rank <span className="font-bold text-slate-800">#{data.evaluation.rank}</span> on Leaderboard
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 space-y-2">
                <Award size={36} className="mx-auto text-slate-200" />
                <p className="text-xs text-slate-400 font-medium">Evaluation has not started yet.</p>
                <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">
                  Pending Judging
                </span>
              </div>
            )}
          </div>

          {/* Scores Breakdown & Feedback */}
          {data.evaluation.submittedSheetsCount > 0 && (
            <div className="bg-white rounded-2xl border p-5 space-y-5">
              
              {/* Score Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Breakdown</h4>
                <div className="space-y-2.5">
                  {data.evaluation.criteria.map(c => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{c.name}</span>
                        <span className="font-bold">{c.avgScore ? c.avgScore.toFixed(1) : '—'} / {c.maxScore}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E83C00] rounded-full transition-all duration-500"
                          style={{ width: `${c.avgScore ? (c.avgScore / c.maxScore) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments/Feedback List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Judge Comments</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {data.evaluation.criteria.flatMap(c => c.comments).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No specific comments recorded.</p>
                  ) : (
                    data.evaluation.criteria.flatMap((c) => 
                      c.comments.map((comm, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[9px] font-bold text-[#E83C00] uppercase tracking-wider block mb-1">
                            {c.name}
                          </span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            "{comm}"
                          </p>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  )
}
