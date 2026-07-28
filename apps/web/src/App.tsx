import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { motion } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { ApplicationsPage } from '@/pages/admin/ApplicationsPage'
import { TeamsPage } from '@/pages/admin/TeamsPage'
import { JudgesPage } from '@/pages/admin/JudgesPage'
import { EmailsPage } from '@/pages/admin/EmailsPage'
import { LeaderboardAdminPage } from '@/pages/admin/LeaderboardAdminPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AuditPage } from '@/pages/admin/AuditPage'
import { ParticipantDashboard } from '@/pages/participant/ParticipantDashboard'
import { JudgeDashboard } from '@/pages/judge/JudgeDashboard'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { useSession } from '@/lib/auth-client'
import { ReactNode, useState, useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ─── Route Protection Helper ─────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: ('SUPER_ADMIN' | 'ADMIN' | 'JUDGE')[]
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession()
  const [minDone, setMinDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (isPending || !minDone) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080D18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,60,0,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo + wordmark */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" style={{ height: '44px', width: '44px' }}>
            <motion.rect width="32" height="32" rx="7" fill="#0a0a0a"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
            <motion.rect x="3" y="5.5" width="17" height="4.5" rx="2.25" fill="#52525b"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} />
            <motion.rect x="7" y="12.5" width="17" height="4.5" rx="2.25" fill="#a1a1aa"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} />
            <motion.rect x="11" y="19.5" width="17" height="4.5" rx="2.25" fill="#e4e4e7"
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />
          </svg>

          <motion.span
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#F8FAFC',
              letterSpacing: '-1px',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              userSelect: 'none',
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.75, ease: 'easeOut' }}
          >
            Snapserve
          </motion.span>
        </motion.div>

        {/* 3 pulsing dots */}
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#E83C00',
                boxShadow: '0 0 8px rgba(232,60,0,0.7)',
              }}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

  if (!session?.user) {
    const isAdminRoute = allowedRoles.includes('ADMIN') || allowedRoles.includes('SUPER_ADMIN')
    return <Navigate to={isAdminRoute ? "/admin-login" : "/judge-login"} replace />
  }

  const role = (session.user as any).role
  if (!allowedRoles.includes(role)) {
    // If Judge goes to admin, redirect to judge dashboard, and vice-versa
    if (role === 'JUDGE') {
      return <Navigate to="/judge" replace />
    }
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function ParticipantProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// ─── Main Router App ─────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<LoginPage />} />
          <Route path="/judge-login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin Protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/judges"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <JudgesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/emails"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <EmailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <LeaderboardAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AuditPage />
              </ProtectedRoute>
            }
          />

          {/* Judge Protected routes */}
          <Route
            path="/judge"
            element={
              <ProtectedRoute allowedRoles={['JUDGE']}>
                <JudgeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant"
            element={
              <ParticipantProtectedRoute>
                <ParticipantDashboard />
              </ParticipantProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0B1220', // updated to Surface 1 matching design spec
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  )
}
