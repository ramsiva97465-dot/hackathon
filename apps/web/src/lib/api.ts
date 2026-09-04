import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Request interceptor — attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle auth errors
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── API Functions ────────────────────────────────────────────────────────────
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
    participantLogin: (email: string) =>
      apiClient.post('/auth/participant-login', { email }),
  },

  // Applications
  applications: {
    create: (data: Record<string, unknown>) =>
      apiClient.post('/applications', data),
    list: (params?: Record<string, string | number>) =>
      apiClient.get('/applications', { params }),
    get: (id: string) => apiClient.get(`/applications/${id}`),
    approve: (id: string) => apiClient.patch(`/applications/${id}/approve`),
    reject: (id: string, reason: string) =>
      apiClient.patch(`/applications/${id}/reject`, { reason }),
    requestChanges: (id: string, message: string) =>
      apiClient.patch(`/applications/${id}/request-changes`, { message }),
    stats: () => apiClient.get('/applications/stats'),
  },

  // Teams
  teams: {
    list: (params?: Record<string, string | number>) =>
      apiClient.get('/teams', { params }),
    get: (id: string) => apiClient.get(`/teams/${id}`),
    assignJudge: (teamId: string, judgeId: string, roundId: string) =>
      apiClient.post(`/teams/${teamId}/assign-judge`, { judgeId, roundId }),
    autoDistributeJudges: (judgesPerTeam?: number, round?: number) =>
      apiClient.post('/teams/auto-distribute-judges', { judgesPerTeam, round }),
    updateTableNumber: (teamId: string, tableNumber: string) =>
      apiClient.patch(`/teams/${teamId}/table-number`, { tableNumber }),
    updateBonus: (teamId: string, bonusPoints: number) =>
      apiClient.patch(`/teams/${teamId}/bonus`, { bonusPoints }),
    import: (teams: any[]) =>
      apiClient.post('/teams/import', { teams }),
    myTeam: () => apiClient.get('/teams/my-team'),
    submitProject: (data: Record<string, any>) =>
      apiClient.post('/teams/submit-project', data),
    promote: (currentRound: number) =>
      apiClient.post('/teams/promote', { currentRound }),
    promoteSpecial: () =>
      apiClient.post('/teams/special/promote'),
    autoDistributeSpecialJudges: (round?: number) =>
      apiClient.post('/teams/special/auto-distribute-judges', { round }),
    undoFinalists: () =>
      apiClient.post('/teams/undo-finalists'),
    resetRounds: () =>
      apiClient.post('/teams/reset-rounds'),
    validateUrl: (url: string) =>
      apiClient.post('/teams/validate-url', { url }),
    remove: (id: string) =>
      apiClient.delete(`/teams/${id}`),
  },

  // Judges
  judges: {
    list: () => apiClient.get('/judges'),
    get: (id: string) => apiClient.get(`/judges/${id}`),
    assignedTeams: (judgeId: string) =>
      apiClient.get(`/judges/${judgeId}/teams`),
    create: (data: Record<string, unknown>) => apiClient.post('/judges', data),
    update: (id: string, data: Record<string, unknown>) =>
      apiClient.patch(`/judges/${id}`, data),
    delete: (id: string) => apiClient.delete(`/judges/${id}`),
  },

  // Scores
  scores: {
    submit: (teamId: string, data: Record<string, unknown>) =>
      apiClient.post(`/scores`, { teamId, ...data }),
    get: (teamId: string, judgeId: string) =>
      apiClient.get(`/scores/${teamId}/${judgeId}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiClient.patch(`/scores/${id}`, data),
    unlock: (id: string) => apiClient.patch(`/scores/${id}/unlock`),
  },

  // Leaderboard
  leaderboard: {
    get: (params?: { round?: number; hackathonId?: string; liveScores?: boolean }) =>
      apiClient.get('/leaderboard', { params }),
    getSpecial: (params?: { round?: number; hackathonId?: string }) =>
      apiClient.get('/leaderboard/special', { params }),
    adminScore: (teamId: string, score: number | null) =>
      apiClient.post('/leaderboard/admin-score', { teamId, score }),
    getTvMode: () => apiClient.get('/leaderboard/tv-mode'),
    setTvMode: (enabled: boolean) =>
      apiClient.post('/leaderboard/tv-mode', { enabled }),
    getRevealState: () => apiClient.get('/leaderboard/reveal-state'),
    startReveal: (round?: number) =>
      apiClient.post('/leaderboard/reveal-start', { round }),
    // `round` is required: a Round 2 step must never be published on the
    // finale channel, or every LCD would unseal the Top 5 podium at once.
    setRevealStep: (step: number, round: number) =>
      apiClient.post('/leaderboard/reveal-step', { step, round }),
    stopReveal: () => apiClient.post('/leaderboard/reveal-stop'),
    getSpecialRevealState: () => apiClient.get('/leaderboard/special/reveal-state'),
    startSpecialReveal: (phase: 'TOP5' | 'FINALE') =>
      apiClient.post('/leaderboard/special/reveal-start', { phase }),
    setSpecialRevealStep: (step: number, phase?: 'TOP5' | 'FINALE') =>
      apiClient.post('/leaderboard/special/reveal-step', { step, phase }),
    stopSpecialReveal: () => apiClient.post('/leaderboard/special/reveal-stop'),
  },

  // Emails
  emails: {
    send: (data: Record<string, unknown>) => apiClient.post('/emails/send', data),
    logs: () => apiClient.get('/emails/logs'),
    preview: (template: string, data: Record<string, unknown>) =>
      apiClient.post('/emails/preview', { template, data }),
  },

  // Analytics
  analytics: {
    overview: () => apiClient.get('/analytics/overview'),
    applications: () => apiClient.get('/analytics/applications'),
    scores: () => apiClient.get('/analytics/scores'),
  },


  // Help Requests
  helpRequests: {
    create: (data: { teamId?: string; issueType: string; description?: string } | string, description?: string) => {
      const payload = typeof data === 'string' ? { issueType: data, description } : data
      return apiClient.post('/help-requests', payload)
    },
    getActive: () => apiClient.get('/help-requests/active'),
    resolve: (id: string) => apiClient.patch(`/help-requests/${id}/resolve`),
  },

  // Audit logs
  audit: {
    list: (params?: Record<string, string | number>) =>
      apiClient.get('/audit', { params }),
  },

  // Settings
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data: Record<string, unknown>) => apiClient.patch('/settings', data),
  },

  // Hackathon
  hackathon: {
    get: () => apiClient.get('/hackathon'),
    update: (data: Record<string, unknown>) => apiClient.patch('/hackathon', data),
  },

  // Announcements
  announcements: {
    getActive: () => apiClient.get('/announcements'),
    getAll: () => apiClient.get('/announcements/all'),
    create: (message: string) => apiClient.post('/announcements', { message }),
    toggleActive: (id: string, isActive: boolean) => apiClient.patch(`/announcements/${id}/toggle`, { isActive }),
    delete: (id: string) => apiClient.delete(`/announcements/${id}`),
  },

  // Attendance & QR Scanner
  attendance: {
    lookup: (q: string) => apiClient.get('/attendance/lookup', { params: { q } }),
    checkIn: (memberId: string, isPresent: boolean) => apiClient.post('/attendance/check-in', { memberId, isPresent }),
    verifyBonus: (teamId: string, bonusPoints: number) => apiClient.post('/attendance/verify-bonus', { teamId, bonusPoints }),
  },
}

export default api
