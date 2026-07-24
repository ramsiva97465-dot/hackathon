import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format = 'MMM dd, yyyy') {
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return format
    .replace('MMM', month)
    .replace('dd', day)
    .replace('yyyy', String(year))
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; className: string; dot: string }> = {
    PENDING: { label: 'Pending', className: 'status-pending', dot: 'bg-warning' },
    UNDER_REVIEW: { label: 'Under Review', className: 'status-review', dot: 'bg-primary' },
    APPROVED: { label: 'Approved', className: 'status-approved', dot: 'bg-success' },
    REJECTED: { label: 'Rejected', className: 'status-rejected', dot: 'bg-danger' },
    WAITLISTED: { label: 'Waitlisted', className: 'status-review', dot: 'bg-muted' },
  }
  return configs[status] ?? { label: status, className: '', dot: 'bg-muted' }
}

export function getTrackConfig(track: string) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    VOICE_AI_AGENT: { label: 'Voice AI Agent', color: '#818CF8', bg: 'rgba(79,70,229,0.1)' },
    MULTIMODAL_AI: { label: 'Multimodal AI', color: '#67E8F9', bg: 'rgba(6,182,212,0.1)' },
    REAL_WORLD_DEPLOYMENT: { label: 'Real-World Deploy', color: '#C4B5FD', bg: 'rgba(139,92,246,0.1)' },
  }
  return configs[track] ?? { label: track, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' }
}

export function generateAvatarColor(name: string): string {
  const colors = [
    '#4F46E5', '#06B6D4', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function getRankSuffix(rank: number): string {
  const j = rank % 10
  const k = rank % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
