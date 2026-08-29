import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Award, Mail, Trophy,
  Settings, ScrollText, Mic, ChevronLeft, ChevronRight,
  Bell, LogOut, Gavel, Zap, Radio, QrCode, Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'
import { useAuthStore } from '@/store/auth.store'
import { signOut } from '@/lib/auth-client'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface SidebarRoute {
  href: string
  label: string
  icon: ReactNode
  badge?: number
  section?: string
}

interface DashboardLayoutProps {
  children: ReactNode
  role: 'admin' | 'judge'
}

const adminRoutes: SidebarRoute[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={17} />, section: 'main' },
  { href: '/admin/teams', label: 'Teams', icon: <Users size={17} />, section: 'main' },
  { href: '/admin/scanner', label: 'QR Desk Scanner', icon: <QrCode size={17} />, section: 'main' },
  { href: '/admin/judges', label: 'Judges', icon: <Award size={17} />, section: 'main' },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: <Trophy size={17} />, section: 'main' },
  { href: '/admin/rounds', label: 'Rounds Management', icon: <Zap size={17} />, section: 'main' },
  { href: '/admin/command-center', label: 'Command Center', icon: <Radio size={17} />, section: 'tools' },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={17} />, section: 'tools' },
]

const judgeRoutes: SidebarRoute[] = [
  { href: '/judge', label: 'My Teams', icon: <Gavel size={17} /> },
]

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const routes = role === 'admin' ? adminRoutes : judgeRoutes

  const [tvMode, setTvMode] = useState(() => {
    return localStorage.getItem('snapserve_tv_mode') === 'true'
  })

  useEffect(() => {
    if (role === 'admin') {
      api.leaderboard.getTvMode()
        .then(res => {
          if (typeof res.data?.tvMode === 'boolean') {
            setTvMode(res.data.tvMode)
            localStorage.setItem('snapserve_tv_mode', res.data.tvMode ? 'true' : 'false')
          }
        })
        .catch(() => {})
    }
  }, [role])

  const handleToggleTvMode = async () => {
    const nextVal = !tvMode
    setTvMode(nextVal)
    localStorage.setItem('snapserve_tv_mode', nextVal ? 'true' : 'false')
    window.dispatchEvent(new Event('tv_mode_toggled'))
    try {
      await api.leaderboard.setTvMode(nextVal)
      toast.success(nextVal ? '📺 TV Mode ENABLED for Leaderboard!' : '📺 TV Mode DISABLED for Leaderboard!')
    } catch (err) {
      toast.success(nextVal ? '📺 TV Mode ENABLED locally!' : '📺 TV Mode DISABLED locally!')
    }
  }

  const handleSignOut = async () => {
    logout() // clear local store
    await signOut() // clear server session cookie
    window.location.href = role === 'admin' ? '/admin-login' : '/judge-login'
  }

  useEffect(() => {
    if (window.innerWidth < 768) {
      useAppStore.getState().setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div 
      className={cn(
        "flex h-screen overflow-hidden",
        role === 'admin' ? "text-slate-100" : "text-[#0F172A]"
      )}
      style={{ backgroundColor: role === 'admin' ? '#050505' : (role === 'judge' ? '#EBE3D5' : '#F4ECE1') }}
    >
      {/* Sidebar (Linear Dark Style) */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative flex flex-col h-full',
          'bg-[#0A0908] border-r border-white/5',
          'overflow-hidden shrink-0 z-20 shadow-xl'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 h-16 bg-[#0A0908]">
          <img src="/logos/snapserve-mark.svg" alt="SnapServe" className="w-8 h-8 object-contain shrink-0 rounded-lg shadow-sm" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-display font-bold text-sm text-white leading-tight tracking-tight">
                  SnapServe
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                  ADMIN CONSOLE
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden pt-6">
          {sidebarOpen && (
            <p className="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">
              {role === 'admin' ? 'Management' : 'Judging'}
            </p>
          )}
          {routes.filter(r => !r.section || r.section === 'main').map(route => (
            <SidebarItem key={route.href} route={route} active={location.pathname === route.href} collapsed={!sidebarOpen} />
          ))}

          {role === 'admin' && (
            <>
              {sidebarOpen && (
                <p className="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-5 mb-1">
                  Tools
                </p>
              )}
              {!sidebarOpen && <div className="my-3 h-[1px] bg-white/10" />}
              {adminRoutes.filter(r => r.section === 'tools').map(route => (
                <SidebarItem key={route.href} route={route} active={location.pathname === route.href} collapsed={!sidebarOpen} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom Panel */}
        <div className="border-t border-white/5 p-3 space-y-2 bg-[#0A0908]">
          <div className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer',
            !sidebarOpen && 'justify-center'
          )}>
            <Avatar name={user?.name ?? 'Admin'} size="sm" status="online" className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-bold text-white truncate">{user?.name ?? 'Admin User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email ?? 'admin@hackathon.com'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0" style={{ background: 'linear-gradient(135deg, #0A0908 0%, #1A1512 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E83C00] shadow-[0_0_8px_rgba(232,60,0,0.8)] mr-1" />
            <span className="text-white text-xs font-bold uppercase tracking-widest opacity-90">
              {role === 'admin' ? 'ADMIN CONSOLE · VOICEATHON 2026' : 'JUDGE DESK · VOICEATHON 2026'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <button
                onClick={handleToggleTvMode}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-md cursor-pointer select-none",
                  tvMode
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40 ring-1 ring-emerald-500/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                )}
                title={tvMode ? "TV Mode is ACTIVE on Leaderboard (Auto-Scroll)" : "Turn ON TV Mode on Leaderboard"}
              >
                <Monitor size={14} className={tvMode ? "text-emerald-400 animate-pulse" : "text-slate-400"} />
                <span>{tvMode ? "TV Mode: ON" : "TV Mode: OFF"}</span>
              </button>
            )}
            <Link to="/" className="text-xs text-slate-300 hover:text-white font-semibold transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              View Website
            </Link>
            <button className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10 transition-all cursor-pointer">
              <Bell size={16} />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-[#E83C00] hover:bg-[#E83C00]/10 border border-[#E83C00]/20 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main 
          className="flex-grow overflow-y-auto"
          style={{ backgroundColor: 'transparent' }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function SidebarItem({
  route,
  active,
  collapsed,
}: {
  route: SidebarRoute
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      to={route.href}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-xl',
        'text-xs font-semibold transition-all duration-300 border border-transparent',
        active
          ? 'bg-[#E83C00]/15 text-[#E83C00] border-[#E83C00]/25 shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-white/5',
        collapsed && 'justify-center px-2'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#E83C00] rounded-r-full" />
      )}

      <span className={cn('shrink-0', active ? 'text-[#E83C00]' : '')}>{route.icon}</span>

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap"
          >
            {route.label}
          </motion.span>
        )}
      </AnimatePresence>

      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-white text-[#0F172A] text-[10px] font-bold border border-slate-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {route.label}
        </span>
      )}
    </Link>
  )
}
