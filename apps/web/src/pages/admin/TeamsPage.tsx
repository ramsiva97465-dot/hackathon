import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { containerVariants, itemVariants } from '@/lib/motion'
import { getTrackConfig } from '@/lib/utils'
import {
  Trophy, Users, Award, X, Check,
  Search, Hash, Star, UserPlus, Download, Upload, AlertCircle, CheckCircle, Eye, ExternalLink, Github, Phone, Cpu, Layers, Instagram, Linkedin, Trash2
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let currentVal = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim())
      currentVal = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      row.push(currentVal.trim())
      lines.push(row)
      row = []
      currentVal = ''
    } else {
      currentVal += char
    }
  }
  if (row.length > 0 || currentVal !== '') {
    row.push(currentVal.trim())
    lines.push(row)
  }
  return lines.filter(r => r.some(cell => cell !== ''))
}

function processCsvData(text: string) {
  const parsed = parseCSV(text)
  if (parsed.length < 2) {
    return { error: 'The CSV file is empty or missing headers.' }
  }

  const rawHeaders = parsed[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
  
  const teamNameIdx = rawHeaders.findIndex(h => h.includes('teamname') || h === 'team')
  const trackIdx = rawHeaders.findIndex(h => h.includes('track') || h === 'category')
  const tableIdx = rawHeaders.findIndex(h => h.includes('tablenumber') || h === 'table' || h === 'tableno')
  const collegeIdx = rawHeaders.findIndex(h => h.includes('college') || h === 'university' || h === 'school')
  const nameIdx = rawHeaders.findIndex(h => h === 'name' || h.includes('participantname') || h.includes('membername') || h.includes('leadername'))
  const emailIdx = rawHeaders.findIndex(h => h === 'email' || h.includes('participantemail') || h.includes('memberemail') || h.includes('leaderemail'))
  const phoneIdx = rawHeaders.findIndex(h => h === 'phone' || h.includes('phone') || h.includes('mobile'))
  const roleIdx = rawHeaders.findIndex(h => h === 'role' || h.includes('memberrole') || h.includes('position'))

  if (teamNameIdx === -1) return { error: 'Could not find "Team Name" column in the CSV.' }
  if (nameIdx === -1) return { error: 'Could not find "Name" or "Participant Name" column in the CSV.' }
  if (emailIdx === -1) return { error: 'Could not find "Email" or "Participant Email" column in the CSV.' }

  const teamsMap: Record<string, any> = {}
  const errors: string[] = []

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i]
    if (row.length === 0 || row.every(c => c === '')) continue

    const teamName = row[teamNameIdx]?.trim()
    const track = trackIdx !== -1 ? row[trackIdx]?.trim() : undefined
    const tableNumber = tableIdx !== -1 ? row[tableIdx]?.trim() : undefined
    const college = collegeIdx !== -1 ? row[collegeIdx]?.trim() : undefined
    const name = row[nameIdx]?.trim()
    const email = row[emailIdx]?.trim()
    const phone = phoneIdx !== -1 ? row[phoneIdx]?.trim() : undefined
    const role = roleIdx !== -1 ? row[roleIdx]?.trim() : undefined

    const rowNum = i + 1

    if (!teamName) {
      errors.push(`Row ${rowNum}: Team Name is missing.`)
      continue
    }
    if (!name) {
      errors.push(`Row ${rowNum} (${teamName}): Participant Name is missing.`)
      continue
    }
    if (!email) {
      errors.push(`Row ${rowNum} (${teamName}): Email is missing.`)
      continue
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNum} (${teamName}): Invalid email format "${email}".`)
      continue
    }

    if (!teamsMap[teamName]) {
      teamsMap[teamName] = {
        name: teamName,
        track,
        tableNumber,
        college,
        members: []
      }
    }

    teamsMap[teamName].members.push({
      name,
      email,
      phone,
      role: role || (teamsMap[teamName].members.length === 0 ? 'Leader' : 'Member')
    })
  }

  return {
    teams: Object.values(teamsMap),
    errors
  }
}


type Team = {
  id: string; name: string; college: string; track: string
  members: { name: string; email?: string; phone?: string; role?: string; linkedin?: string; instagram?: string; github?: string; followedInstagram?: boolean; followedLinkedin?: boolean }[]
  judgesAssigned: number; totalJudges: number
  avgScore: number | null; rank: number | null
  status: string; tableNumber: string | null
  projectTitle?: string | null
  projectDescription?: string | null
  agentName?: string | null
  agentSolution?: string | null
  agentPhoneNumber?: string | null
  githubUrl?: string | null
  demoUrl?: string | null
  techStack?: string[]
  bonusPoints: number; followedInstagram: boolean; followedLinkedin: boolean
}

type Judge = {
  id: string; name: string; email: string; avatar: string | null
  company: string | null; designation: string | null; assignmentsCount: number
}

const RANK_STYLE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', text: '#fff', label: '🥇' },
  2: { bg: 'linear-gradient(135deg,#94A3B8,#64748B)', text: '#fff', label: '🥈' },
  3: { bg: 'linear-gradient(135deg,#CD7F32,#92400E)', text: '#fff', label: '🥉' },
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [assignTarget, setAssignTarget] = useState<Team | null>(null)
  const [viewTarget, setViewTarget] = useState<Team | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editingTableValue, setEditingTableValue] = useState('')
  const [savingTable, setSavingTable] = useState(false)

  const [editingBonusId, setEditingBonusId] = useState<string | null>(null)
  const [editingBonusValue, setEditingBonusValue] = useState<number>(0)
  const [savingBonus, setSavingBonus] = useState(false)

  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [importingCsv, setImportingCsv] = useState(false)
  const [parsedTeams, setParsedTeams] = useState<any[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDownloadTemplate = () => {
    const csvContent = "Team Name,Track,Table Number,College,Name,Email,Phone,Role\n" +
      "EchoFlow AI,Voice AI,T-01,IIT Madras,Arjun Mehta,arjun@example.com,9876543210,Leader\n" +
      "EchoFlow AI,Voice AI,T-01,IIT Madras,Sneha Rao,sneha@example.com,9876543211,Member\n" +
      "VoxAgent Pro,Conversational AI,T-02,BITS Pilani,Karthik Sen,karthik@example.com,,Leader"
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "hackathon_teams_template.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const result = processCsvData(text)
      if (result.error) {
        toast.error(result.error)
        setParsedTeams([])
        setParseErrors([])
      } else {
        const teams = result.teams || []
        const errors = result.errors || []
        setParsedTeams(teams)
        setParseErrors(errors)
        if (teams.length > 0) {
          toast.success(`Parsed ${teams.length} teams successfully!`)
        } else {
          toast.warning('No valid teams found in the CSV.')
        }
      }
    }
    reader.readAsText(file)
  }

  const handleUploadCsv = async () => {
    if (parsedTeams.length === 0) return
    try {
      setImportingCsv(true)
      const res = await api.teams.import(parsedTeams)
      if (res.data?.success) {
        toast.success(`Successfully imported ${res.data.data.createdTeams} teams and ${res.data.data.createdMembers} members!`)
        await fetchTeams()
        setCsvImportOpen(false)
        setParsedTeams([])
        setParseErrors([])
      } else {
        toast.error(res.data?.error || 'Failed to import teams.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to import teams.')
    } finally {
      setImportingCsv(false)
    }
  }

  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    toast.success(`Exported ${filename}`)
  }

  const handleExportTeamsOnlyCSV = () => {
    const teamItems = teams.filter(t => t.members.length > 1)
    if (teamItems.length === 0) return toast.error('No multi-member team entries found.')
    const headers = ['Team ID', 'Team Name', 'Members Count', 'Track', 'Table Number', 'College', 'Project Title', 'Agent System', 'Hotline Number', 'Live Demo URL', 'GitHub URL', 'Bonus Points', 'Avg Score', 'Rank', 'Member Names', 'Member Emails']
    const rows = teamItems.map(t => [
      `"${t.id}"`, `"${t.name.replace(/"/g, '""')}"`, `"${t.members.length}"`, `"${t.track}"`, `"${t.tableNumber || ''}"`,
      `"${(t.college || '').replace(/"/g, '""')}"`, `"${(t.projectTitle || '').replace(/"/g, '""')}"`, `"${(t.agentName || '').replace(/"/g, '""')}"`,
      `"${(t.agentPhoneNumber || '').replace(/"/g, '""')}"`, `"${(t.demoUrl || '').replace(/"/g, '""')}"`, `"${(t.githubUrl || '').replace(/"/g, '""')}"`,
      `"${t.bonusPoints || 0}"`, `"${t.avgScore !== null ? t.avgScore.toFixed(2) : ''}"`, `"${t.rank || ''}"`,
      `"${t.members.map(m => m.name).join('; ').replace(/"/g, '""')}"`, `"${t.members.map(m => m.email || '').join('; ').replace(/"/g, '""')}"`
    ])
    downloadCSV(`SnapServe_Hackathon_Teams_Only_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  const handleExportSingleOnlyCSV = () => {
    const singleItems = teams.filter(t => t.members.length === 1)
    if (singleItems.length === 0) return toast.error('No single/solo entries found.')
    const headers = ['Participant Name', 'Participant Email', 'Participant Phone', 'Team/Solo Name', 'Track', 'Table Number', 'College', 'Project Title', 'Agent System', 'Hotline Number', 'Live Demo URL', 'GitHub URL', 'Bonus Points', 'Avg Score', 'Rank']
    const rows = singleItems.map(t => {
      const m = t.members[0] || { name: '', email: '', phone: '' }
      return [
        `"${(m.name || '').replace(/"/g, '""')}"`, `"${(m.email || '').replace(/"/g, '""')}"`, `"${(m.phone || '').replace(/"/g, '""')}"`,
        `"${t.name.replace(/"/g, '""')}"`, `"${t.track}"`, `"${t.tableNumber || ''}"`, `"${(t.college || '').replace(/"/g, '""')}"`,
        `"${(t.projectTitle || '').replace(/"/g, '""')}"`, `"${(t.agentName || '').replace(/"/g, '""')}"`, `"${(t.agentPhoneNumber || '').replace(/"/g, '""')}"`,
        `"${(t.demoUrl || '').replace(/"/g, '""')}"`, `"${(t.githubUrl || '').replace(/"/g, '""')}"`, `"${t.bonusPoints || 0}"`,
        `"${t.avgScore !== null ? t.avgScore.toFixed(2) : ''}"`, `"${t.rank || ''}"`
      ]
    })
    downloadCSV(`SnapServe_Hackathon_Single_Participants_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  const handleExportIndividualMembersCSV = () => {
    if (!teams || teams.length === 0) return toast.error('No participants to export.')
    const headers = ['Participant Name', 'Participant Email', 'Participant Phone', 'Role', 'Entry Type', 'Team/Solo Name', 'Track', 'Table Number', 'College', 'Project Title', 'Agent System', 'Hotline Number', 'Live Demo URL', 'GitHub URL', 'Bonus Points', 'Avg Score', 'Rank']
    const rows: string[][] = []
    teams.forEach(t => {
      const entryType = t.members.length === 1 ? 'Single (Solo)' : 'Team'
      t.members.forEach(m => {
        rows.push([
          `"${(m.name || '').replace(/"/g, '""')}"`, `"${(m.email || '').replace(/"/g, '""')}"`, `"${(m.phone || '').replace(/"/g, '""')}"`,
          `"${(m.role || 'Member').replace(/"/g, '""')}"`, `"${entryType}"`, `"${t.name.replace(/"/g, '""')}"`, `"${t.track}"`,
          `"${t.tableNumber || ''}"`, `"${(t.college || '').replace(/"/g, '""')}"`, `"${(t.projectTitle || '').replace(/"/g, '""')}"`,
          `"${(t.agentName || '').replace(/"/g, '""')}"`, `"${(t.agentPhoneNumber || '').replace(/"/g, '""')}"`, `"${(t.demoUrl || '').replace(/"/g, '""')}"`,
          `"${(t.githubUrl || '').replace(/"/g, '""')}"`, `"${t.bonusPoints || 0}"`, `"${t.avgScore !== null ? t.avgScore.toFixed(2) : ''}"`,
          `"${t.rank || ''}"`
        ])
      })
    })
    downloadCSV(`SnapServe_Hackathon_All_Participants_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  const handleExportAllTeamsCSV = () => {
    if (!teams || teams.length === 0) {
      toast.error('No teams to export.')
      return
    }

    const headers = [
      'Team ID',
      'Team Name',
      'Team Lead Name',
      'Team Lead Login Email',
      'Portal Login Link',
      'Track',
      'Table Number',
      'College',
      'Project Title',
      'Agent System',
      'Hotline Number',
      'Live Demo URL',
      'GitHub URL',
      'Tech Stack',
      'Bonus Points',
      'Avg Score',
      'Rank',
      'Member Names',
      'Member Emails'
    ]

    const rows = teams.map(t => {
      const leadMember = t.members[0] || { name: '', email: '' }
      const memberNames = t.members.map(m => m.name).join('; ')
      const memberEmails = t.members.map(m => m.email || '').join('; ')
      const techStackStr = t.techStack ? t.techStack.join('; ') : ''
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      return [
        `"${t.id}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${(leadMember.name || '').replace(/"/g, '""')}"`,
        `"${(leadMember.email || '').replace(/"/g, '""')}"`,
        `"${origin}/participant/login"`,
        `"${t.track}"`,
        `"${t.tableNumber || ''}"`,
        `"${(t.college || '').replace(/"/g, '""')}"`,
        `"${(t.projectTitle || '').replace(/"/g, '""')}"`,
        `"${(t.agentName || '').replace(/"/g, '""')}"`,
        `"${(t.agentPhoneNumber || '').replace(/"/g, '""')}"`,
        `"${(t.demoUrl || '').replace(/"/g, '""')}"`,
        `"${(t.githubUrl || '').replace(/"/g, '""')}"`,
        `"${techStackStr.replace(/"/g, '""')}"`,
        `"${t.bonusPoints || 0}"`,
        `"${t.avgScore !== null ? t.avgScore.toFixed(2) : ''}"`,
        `"${t.rank || ''}"`,
        `"${memberNames.replace(/"/g, '""')}"`,
        `"${memberEmails.replace(/"/g, '""')}"`
      ]
    })

    downloadCSV(`SnapServe_Hackathon_All_Teams_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  useEffect(() => { fetchTeams(); fetchJudges() }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const res = await api.teams.list()
      if (res.data?.success) setTeams(res.data.data)
    } catch (err) { console.error('Failed to load teams', err) }
    finally { setLoading(false) }
  }

  const fetchJudges = async () => {
    try {
      const res = await api.judges.list()
      if (res.data?.success) setJudges(res.data.data)
    } catch (err) { console.error('Failed to load judges', err) }
  }

  const handleAssignJudge = async (judgeId: string) => {
    if (!assignTarget) return
    try {
      setAssigning(true)
      await api.teams.assignJudge(assignTarget.id, judgeId, 'round1')
      await fetchTeams()
      setAssignTarget(null)
    } catch (err) { console.error('Failed to assign judge', err) }
    finally { setAssigning(false) }
  }

  const handleSaveTableNumber = async (teamId: string) => {
    try {
      setSavingTable(true)
      await api.teams.updateTableNumber(teamId, editingTableValue)
      toast.success('Table number updated')
      setEditingTableId(null)
      fetchTeams()
    } catch (err) {
      toast.error('Failed to update table number')
    } finally {
      setSavingTable(false)
    }
  }

  const handleSaveBonus = async (teamId: string) => {
    try {
      setSavingBonus(true)
      await api.teams.updateBonus(teamId, editingBonusValue)
      toast.success('Bonus points updated')
      setEditingBonusId(null)
      fetchTeams()
    } catch (err) {
      toast.error('Failed to update bonus points')
    } finally {
      setSavingBonus(false)
    }
  }

  const [distributing, setDistributing] = useState(false)

  const handleAutoDistribute = async () => {
    try {
      setDistributing(true)
      const res = await api.teams.autoDistributeJudges(1)
      if (res.data?.success) {
        toast.success(res.data.message || 'Auto-assigned 1 judge per team across all judges!')
        fetchTeams()
      } else {
        toast.error(res.data?.message || 'Auto-assignment failed.')
      }
    } catch (err) {
      toast.error('Failed to auto-distribute teams.')
    } finally {
      setDistributing(false)
    }
  }

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.college?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Teams',      value: teams.length,                                       icon: Users,  color: '#E83C00', bg: 'rgba(232,60,0,0.07)',    border: 'rgba(232,60,0,0.15)'    },
    { label: 'Judging Complete', value: teams.filter(t => t.judgesAssigned >= t.totalJudges && t.totalJudges > 0).length, icon: Award,  color: '#10B981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.15)' },
    { label: 'On Leaderboard',   value: teams.filter(t => t.rank !== null).length,           icon: Trophy, color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.15)' },
  ]

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-[1400px] space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Teams</h1>
            <p className="text-sm text-white/50 mt-0.5">All approved teams competing in the hackathon.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {stats.map(({ icon: Icon, label, value, color, border }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ border: `1.5px solid ${border}`, background: '#111' }}>
                <Icon size={14} style={{ color }} />
                <span className="text-sm font-bold text-white">{value}</span>
                <span className="text-xs text-white/40 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search + Table Card ── */}
        <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Search Bar */}
          <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search teams or college…"
                  className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-all w-64 text-white placeholder:text-slate-500"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,60,0,0.5)'; e.currentTarget.style.background = '#1a1a1a' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = '#111' }}
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl text-slate-200 transition-all bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 cursor-pointer"
                >
                  <Download size={14} />
                  Export CSV
                </button>

                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => { setExportMenuOpen(false); handleExportTeamsOnlyCSV() }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>👥 Export Teams Only (Multiple Members)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setExportMenuOpen(false); handleExportSingleOnlyCSV() }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>👤 Export Single / Solo Participants</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setExportMenuOpen(false); handleExportIndividualMembersCSV() }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>📋 Export All Participants (Single Rows)</span>
                      </button>
                      <div className="border-t border-slate-800 my-1" />
                      <button
                        type="button"
                        onClick={() => { setExportMenuOpen(false); handleExportAllTeamsCSV() }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>📦 Export Combined Full Sheet</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setCsvImportOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all bg-[#E83C00] hover:bg-[#c93400] shadow-sm shadow-orange-950/10"
              >
                <Upload size={14} />
                Import CSV
              </button>

              <button
                disabled={distributing}
                onClick={handleAutoDistribute}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl text-amber-300 transition-all bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 disabled:opacity-50 cursor-pointer"
                title="Auto-distribute 100 teams evenly across all confirmed judges"
              >
                <UserPlus size={14} className="text-amber-400" />
                {distributing ? 'Assigning…' : '⚡ Auto-Assign to Judges'}
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-400">{filtered.length} teams</span>
          </div>

          {/* Column Headers */}
          <div className="grid px-5 py-3"
            style={{
              gridTemplateColumns: '2.5fr 1fr 0.8fr 1.6fr 1.1fr 220px',
              background: '#111',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
            {['Team', 'Track', 'Table', 'Social Follows', 'Judging', 'Actions'].map(col => (
              <span key={col} className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{col}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-[#E83C00] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-500">Loading teams…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Users size={28} style={{ color: '#475569' }} />
              </div>
              <p className="text-sm font-semibold text-slate-400">No teams found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search or import CSV first.</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {filtered.map((team, idx) => {
                const track = getTrackConfig(team.track)
                const requiredJudges = 1
                const judgeProgress = Math.min(100, (team.judgesAssigned / requiredJudges) * 100)
                const isLast = idx === filtered.length - 1
                const rankStyle = team.rank && team.rank <= 3 ? RANK_STYLE[team.rank] : null

                return (
                  <motion.div
                    key={team.id}
                    variants={itemVariants}
                    className="grid px-5 py-4 items-center transition-colors cursor-default"
                    style={{
                      gridTemplateColumns: '2.5fr 1fr 0.8fr 1.6fr 1.1fr 220px',
                      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.02)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Team */}
                    <div className="flex items-center gap-3 min-w-0">
                      {rankStyle ? (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ background: rankStyle.bg }}>
                          {rankStyle.label}
                        </div>
                      ) : team.rank ? (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                          style={{ background: '#1a1a1a', color: '#64748B' }}>
                          #{team.rank}
                        </div>
                      ) : null}
                      <Avatar name={team.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{team.name}</p>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{team.members.length === 1 ? 'Solo' : `${team.members.length} members`}</span>
                          {team.members[0]?.phone && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="flex items-center gap-0.5 text-slate-300">
                                <Phone size={8} /> {team.members[0].phone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Track */}
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: track.bg, color: track.color, border: `1px solid ${track.color}22` }}>
                      {track.label}
                    </span>

                    {/* Table Number */}
                    <div>
                      {editingTableId === team.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editingTableValue}
                            onChange={e => setEditingTableValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTableNumber(team.id)}
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg outline-none transition-all"
                            style={{ border: '1.5px solid rgba(232,60,0,0.4)', background: '#fff' }}
                          />
                          <button disabled={savingTable} onClick={() => handleSaveTableNumber(team.id)}
                            className="text-emerald-500 hover:text-emerald-700 transition-colors">
                            <Check size={13} />
                          </button>
                          <button disabled={savingTable} onClick={() => setEditingTableId(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 group cursor-pointer w-fit px-2 py-1 rounded-lg transition-all"
                          onClick={() => { setEditingTableId(team.id); setEditingTableValue(team.tableNumber || '') }}
                          style={{ border: '1px solid transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,60,0,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                        >
                          <Hash size={11} className="text-slate-500 group-hover:text-[#E83C00] transition-colors" />
                          <span className="text-sm font-bold text-slate-200 group-hover:text-[#E83C00] transition-colors">
                            {team.tableNumber || <span className="text-slate-500 text-xs font-medium">—</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Social Follows & Bonus Points */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        team.followedInstagram ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
                      }`}>
                        <Instagram size={10} /> {team.followedInstagram ? 'IG ✓' : 'IG ✗'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        team.followedLinkedin ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
                      }`}>
                        <Linkedin size={10} /> {team.followedLinkedin ? 'LI ✓' : 'LI ✗'}
                      </span>

                      {/* Interactive Bonus Points Chip */}
                      {editingBonusId === team.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={editingBonusValue}
                            onChange={e => setEditingBonusValue(Number(e.target.value))}
                            onKeyDown={e => e.key === 'Enter' && handleSaveBonus(team.id)}
                            className="w-12 px-1 py-0.5 text-xs font-bold rounded bg-slate-900 text-amber-400 border border-amber-500/50 outline-none"
                          />
                          <button disabled={savingBonus} onClick={() => handleSaveBonus(team.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check size={12} />
                          </button>
                          <button disabled={savingBonus} onClick={() => setEditingBonusId(null)} className="text-slate-400 hover:text-slate-300">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingBonusId(team.id); setEditingBonusValue(team.bonusPoints || 0) }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                          title="Click to edit bonus points"
                        >
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span>+{team.bonusPoints || 0} Pts</span>
                        </button>
                      )}
                    </div>

                    {/* Judging */}
                    <div className="pr-3">
                      {team.avgScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-slate-200">{team.avgScore.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-500 font-medium">avg</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Judges</span>
                            <span>{team.judgesAssigned}/{requiredJudges}</span>
                          </div>
                          <Progress value={judgeProgress} variant={judgeProgress === 100 ? 'success' : 'primary'} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {team.demoUrl && (
                        <a
                          href={team.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Presentation Drive URL"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                        >
                          <ExternalLink size={11} /> Drive
                        </a>
                      )}
                      <button
                        onClick={() => setViewTarget(team)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap"
                      >
                        <Eye size={11} /> Details
                      </button>
                      <button
                        onClick={() => setAssignTarget(team)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#E83C00]/10 text-[#E83C00] hover:bg-[#E83C00]/20 border border-[#E83C00]/20 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap"
                      >
                        <UserPlus size={11} /> Assign
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── View Team Submission Details Modal ── */}
      <AnimatePresence>
        {viewTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#E83C00] uppercase tracking-wider block">Submission Details</span>
                  <h3 className="text-lg font-black text-slate-900">{viewTarget.projectTitle || viewTarget.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to completely remove "${viewTarget.name}"? This action cannot be undone.`)) {
                        try {
                          await api.teams.remove(viewTarget.id)
                          toast.success('Team removed successfully')
                          setViewTarget(null)
                          fetchTeams()
                        } catch (err) {
                          toast.error('Failed to remove team')
                        }
                      }
                    }}
                    className="p-1.5 px-3 flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold"
                  >
                    <Trash2 size={13} />
                    Remove Team
                  </button>
                  <button
                    onClick={() => setViewTarget(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Team Name</span>
                    <span className="font-extrabold text-slate-900">{viewTarget.name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Track</span>
                    <span className="font-extrabold text-slate-900">{viewTarget.track || 'General'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Agent Name</span>
                    <span className="font-extrabold text-slate-900">{viewTarget.agentName || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Live Call Number</span>
                    <span className="font-extrabold text-[#E83C00]">{viewTarget.agentPhoneNumber || '—'}</span>
                  </div>
                </div>

                {/* Project Overview Box */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#E83C00] uppercase tracking-widest">Project Submission</span>
                    {viewTarget.tableNumber && (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-amber-400 font-mono text-[10px] font-bold">
                        Table {viewTarget.tableNumber}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-lg text-white">{viewTarget.projectTitle || viewTarget.name}</h4>
                  
                  {viewTarget.agentName && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
                      <Cpu size={12} className="text-[#E83C00]" />
                      <span className="text-slate-400">Agent System:</span>
                      <span className="font-bold text-white">{viewTarget.agentName}</span>
                    </div>
                  )}

                  {viewTarget.agentPhoneNumber && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone size={12} className="text-emerald-400" />
                      <span className="text-slate-400">Hotline:</span>
                      <span className="font-mono font-bold text-emerald-400">{viewTarget.agentPhoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Solution Description */}
                {viewTarget.agentSolution && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solution Description</span>
                    <p className="text-xs text-slate-700 leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {viewTarget.agentSolution}
                    </p>
                  </div>
                )}

                {/* Links Row */}
                {(viewTarget.githubUrl || viewTarget.demoUrl) && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {viewTarget.demoUrl && (
                      <a
                        href={viewTarget.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E83C00] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#c93400] transition-colors"
                      >
                        <ExternalLink size={12} /> Live Demo URL
                      </a>
                    )}

                    {viewTarget.githubUrl && (
                      <a
                        href={viewTarget.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-colors"
                      >
                        <Github size={12} /> GitHub Code Repo
                      </a>
                    )}
                  </div>
                )}

                {/* Tech Stack */}
                {viewTarget.techStack && viewTarget.techStack.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Layers size={11} className="text-[#E83C00]" /> Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewTarget.techStack.map((tech, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-md font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Verification Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Team Social Verification
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Requirement: All Members Must Follow
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      viewTarget.followedInstagram
                        ? 'bg-pink-50 border-pink-200 text-pink-900 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Instagram size={14} className={viewTarget.followedInstagram ? 'text-pink-600' : 'text-slate-400'} />
                        <span>Instagram</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                        viewTarget.followedInstagram ? 'bg-pink-200 text-pink-950' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {viewTarget.followedInstagram ? 'All Followed ✓' : 'Pending ✗'}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      viewTarget.followedLinkedin
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Linkedin size={14} className={viewTarget.followedLinkedin ? 'text-blue-600' : 'text-slate-400'} />
                        <span>LinkedIn</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                        viewTarget.followedLinkedin ? 'bg-blue-200 text-blue-950' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {viewTarget.followedLinkedin ? 'All Followed ✓' : 'Pending ✗'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── ADMIN BONUS / EXTRA POINTS CARD ── */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-300/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                      <Star size={12} className="fill-amber-500 text-amber-500" /> Admin Award Bonus Points
                    </span>
                    <span className="text-xs font-black text-amber-900 font-mono bg-amber-200/80 px-2 py-0.5 rounded">
                      Current: +{viewTarget.bonusPoints || 0} Pts
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-amber-900/80">Click to instantly award bonus points added directly to leaderboard total score:</p>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.teams.updateBonus(viewTarget.id, 0)
                            setViewTarget({ ...viewTarget, bonusPoints: 0 })
                            toast.success(`Cleared Bonus Points for ${viewTarget.name}`)
                            fetchTeams()
                          } catch (err) {
                            toast.error('Failed to clear bonus points')
                          }
                        }}
                        disabled={!viewTarget.bonusPoints}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          !viewTarget.bonusPoints
                            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'bg-white text-red-500 border-red-200 hover:bg-red-50 cursor-pointer shadow-sm'
                        }`}
                      >
                        Clear
                      </button>
                      {[2, 4, 6, 8, 10].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={async () => {
                            try {
                              await api.teams.updateBonus(viewTarget.id, pts)
                              setViewTarget({ ...viewTarget, bonusPoints: pts })
                              toast.success(`Awarded +${pts} Bonus Points to ${viewTarget.name}!`)
                              fetchTeams()
                            } catch (err) {
                              toast.error('Failed to update bonus points')
                            }
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            (viewTarget.bonusPoints || 0) === pts
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                              : 'bg-white text-slate-800 border-amber-200 hover:bg-amber-100 hover:border-amber-400'
                          }`}
                        >
                          +{pts}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Member Roster List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Team Member Verification Roster ({viewTarget.members.length} Members)
                  </span>
                  <div className="space-y-1.5">
                    {viewTarget.members.map((m, idx) => {
                      const igFollowed = m.followedInstagram ?? viewTarget.followedInstagram
                      const liFollowed = m.followedLinkedin ?? viewTarget.followedLinkedin
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-[#E83C00]/10 text-[#E83C00] text-[9px] font-extrabold uppercase">
                                  Team Lead
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">{m.email}</div>
                            
                            {/* Member Verification Badges */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                igFollowed ? 'bg-pink-100 text-pink-800 border border-pink-200' : 'bg-slate-200/80 text-slate-500'
                              }`}>
                                <Instagram size={10} /> {igFollowed ? 'IG Followed ✓' : 'IG Pending ✗'}
                              </span>

                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                liFollowed ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200/80 text-slate-500'
                              }`}>
                                <Linkedin size={10} /> {liFollowed ? 'LI Followed ✓' : 'LI Pending ✗'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right">
                            {m.linkedin && (
                              <a
                                href={m.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-[10px] font-bold"
                                title="Open LinkedIn Profile"
                              >
                                <Linkedin size={11} /> Profile ↗
                              </a>
                            )}
                            {m.phone && (
                              <span className="text-[10px] font-mono text-slate-600 block">{m.phone}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Assign Judge Modal ── */}
      <AnimatePresence>
        {assignTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh', border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(232,60,0,0.08)', border: '1px solid rgba(232,60,0,0.18)' }}>
                    <UserPlus size={16} style={{ color: '#E83C00' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Assign Judge</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluating <span className="font-semibold text-slate-700">{assignTarget.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignTarget(null)}
                  className="p-2 rounded-xl transition-colors text-slate-400"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#EEF2F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Judge List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {judges.length === 0 ? (
                  <div className="text-center py-10">
                    <Award size={28} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No judges available</p>
                  </div>
                ) : judges.map(judge => (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
                    style={{ border: '1.5px solid #EEF2F7', background: '#FAFAFA' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,60,0,0.22)'; e.currentTarget.style.background = 'rgba(232,60,0,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEF2F7'; e.currentTarget.style.background = '#FAFAFA' }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={judge.name} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{judge.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {judge.company || 'Independent'} · <span className="font-semibold">{judge.assignmentsCount}</span> assigned
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignJudge(judge.id)}
                      disabled={assigning}
                      className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      style={{ color: '#E83C00', background: 'rgba(232,60,0,0.07)', border: '1px solid rgba(232,60,0,0.18)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.14)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,60,0,0.07)')}
                    >
                      {assigning ? '…' : 'Assign'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CSV Import Modal ── */}
      <AnimatePresence>
        {csvImportOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,13,28,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh', border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 border border-orange-100">
                    <Upload size={16} className="text-[#E83C00]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Import Teams & Members</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Bulk upload via CSV file</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCsvImportOpen(false); setParsedTeams([]); setParseErrors([]) }}
                  className="p-2 rounded-xl transition-colors text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent hover:border-slate-200"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                
                {/* Instructions */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">CSV Requirements</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                      Must contain columns for <strong>Team Name</strong>, <strong>Name</strong>, <strong>Email</strong>, and <strong>Phone</strong>. 
                      Multiple rows with the same <strong>Team Name</strong> are grouped into one team automatically.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm shrink-0"
                  >
                    <Download size={12} />
                    Template
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                    dragActive ? 'border-orange-400 bg-orange-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-sm text-slate-400">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Drag and drop your CSV here, or <span className="text-[#E83C00]">browse</span></p>
                      <p className="text-xs text-slate-400 mt-1">Supports standard CSV files (.csv)</p>
                    </div>
                  </div>
                </div>

                {/* Errors list if any */}
                {parseErrors.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle size={14} />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Validation Errors ({parseErrors.length})</h4>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {parseErrors.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600 font-medium">{err}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {parsedTeams.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <span>Import Preview</span>
                      <span className="text-[#E83C00]">{parsedTeams.length} Teams parsed</span>
                    </div>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <tr>
                            <th className="px-4 py-2">Team Name</th>
                            <th className="px-4 py-2">Phone Number</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2 text-right">Members</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          {parsedTeams.map((pt, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-bold">{pt.name}</td>
                              <td className="px-4 py-2.5 text-slate-600">{pt.members[0]?.phone || '—'}</td>
                              <td className="px-4 py-2.5 text-slate-600 truncate max-w-[150px]" title={pt.members[0]?.email}>{pt.members[0]?.email || '—'}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-[#E83C00]">{pt.members.length} members</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setCsvImportOpen(false); setParsedTeams([]); setParseErrors([]) }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadCsv}
                  disabled={importingCsv || parsedTeams.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all bg-[#E83C00] hover:bg-[#c93400] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-950/10"
                >
                  {importingCsv ? 'Importing...' : `Import ${parsedTeams.length} Teams`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
