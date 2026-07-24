import { ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Award, Mail, Trophy,
  Settings, ScrollText, Mic, ChevronLeft, ChevronRight,
  Bell, LogOut, Gavel, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/ui/Avatar'

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
  { href: '/admin/applications', label: 'Applications', icon: <FileText size={17} />, section: 'main' },
  { href: '/admin/teams', label: 'Teams', icon: <Users size={17} />, section: 'main' },
  { href: '/admin/judges', label: 'Judges', icon: <Award size={17} />, section: 'main' },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: <Trophy size={17} />, section: 'main' },
  { href: '/admin/emails', label: 'Emails', icon: <Mail size={17} />, section: 'tools' },
  { href: '/admin/audit', label: 'Audit Logs', icon: <ScrollText size={17} />, section: 'tools' },
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

  useEffect(() => {
    if (window.innerWidth < 768) {
      useAppStore.getState().setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A]">
      {/* Sidebar (Linear Light Style) */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative flex flex-col h-full',
          'bg-[#F4F6F8] border-r border-slate-200/80',
          'overflow-hidden shrink-0 z-20 shadow-sm'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200/80 h-16 bg-white/40">
          <div className="w-8 h-8 rounded-lg bg-[#5B5CEB] flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-display font-bold text-sm text-[#0F172A] leading-tight tracking-tight">
                  SnapServe
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                  Powered by Vobiz
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden pt-6">
          {sidebarOpen && (
            <p className="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              {role === 'admin' ? 'Management' : 'Judging'}
            </p>
          )}
          {routes.filter(r => !r.section || r.section === 'main').map(route => (
            <SidebarItem key={route.href} route={route} active={location.pathname === route.href} collapsed={!sidebarOpen} />
          ))}

          {role === 'admin' && (
            <>
              {sidebarOpen && (
                <p className="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-5 mb-1">
                  Tools
                </p>
              )}
              {!sidebarOpen && <div className="my-3 h-[1px] bg-slate-200" />}
              {adminRoutes.filter(r => r.section === 'tools').map(route => (
                <SidebarItem key={route.href} route={route} active={location.pathname === route.href} collapsed={!sidebarOpen} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom Panel */}
        <div className="border-t border-slate-200/80 p-3 space-y-2 bg-white/40">
          <div className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-200/55 transition-colors cursor-pointer',
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
                  <p className="text-xs font-bold text-[#0F172A] truncate">{user?.name ?? 'Admin User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email ?? 'admin@hackathon.com'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-200/55 transition-all duration-300"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {role === 'admin' ? 'SnapServe Admin Console' : 'Judge Evaluation Workspace'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-500 hover:text-[#0F172A] font-semibold transition-colors">
              View Website
            </Link>
            <button className="p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/50">
              <Bell size={16} />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-grow overflow-y-auto bg-[#F8FAFC]">
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
          ? 'bg-[#5B5CEB]/10 text-[#5B5CEB] border-[#5B5CEB]/15 shadow-sm'
          : 'text-slate-500 hover:text-[#0F172A] hover:bg-slate-200/40',
        collapsed && 'justify-center px-2'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#5B5CEB] rounded-r-full" />
      )}

      <span className={cn('shrink-0', active ? 'text-[#5B5CEB]' : '')}>{route.icon}</span>

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
