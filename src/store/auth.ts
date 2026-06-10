import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
  header: string
  locked: boolean
  bot: boolean
  created_at: string
  note: string
  url: string
  followers_count: number
  following_count: number
  statuses_count: number
  source?: {
    privacy: string
    sensitive: boolean
    language: string
    note: string
  }
  role?: {
    name: string
    permissions: string
  }
  pleroma?: {
    is_admin?: boolean
    is_moderator?: boolean
  }
}

interface AuthState {
  token: string | null
  user: User | null
  clientId: string | null
  clientSecret: string | null
  instanceUrl: string | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setClientData: (id: string | null, secret: string | null, url: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      clientId: null,
      clientSecret: null,
      instanceUrl: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setClientData: (clientId, clientSecret, instanceUrl) => set({ clientId, clientSecret, instanceUrl }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'akkoma-auth-storage',
    }
  )
)
