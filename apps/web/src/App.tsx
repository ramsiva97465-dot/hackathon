import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LandingPage } from '@/pages/LandingPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ApplicationPage } from '@/pages/ApplicationPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { ApplicationsPage } from '@/pages/admin/ApplicationsPage'
import { TeamsPage } from '@/pages/admin/TeamsPage'
import { JudgesPage } from '@/pages/admin/JudgesPage'
import { EmailsPage } from '@/pages/admin/EmailsPage'
import { LeaderboardAdminPage } from '@/pages/admin/LeaderboardAdminPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AuditPage } from '@/pages/admin/AuditPage'
import { JudgeDashboard } from '@/pages/judge/JudgeDashboard'
import { TeamEvaluationPage } from '@/pages/judge/TeamEvaluationPage'

// Auth Pages & Client
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { useSession } from '@/lib/auth-client'
import { Spinner } from '@/components/ui/Spinner'
import { ReactNode } from 'react'

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

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-muted font-medium select-none">Verifying session token...</span>
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

// ─── Main Router App ─────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/apply" element={<ApplicationPage />} />

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
            path="/judge/team/:id"
            element={
              <ProtectedRoute allowedRoles={['JUDGE']}>
                <TeamEvaluationPage />
              </ProtectedRoute>
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
