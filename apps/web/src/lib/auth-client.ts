import { createAuthClient } from 'better-auth/react'

const rawApiUrl = import.meta.env.VITE_API_URL
const apiBase = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : 'http://localhost:3001/api'

export const authClient = createAuthClient({
  baseURL: `${apiBase}/auth`,
})

export const { signIn, signUp, signOut, useSession } = authClient
