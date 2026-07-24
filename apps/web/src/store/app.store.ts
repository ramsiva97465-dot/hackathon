import { create } from 'zustand'

interface AppState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // AI Assistant
  aiAssistantOpen: boolean
  setAiAssistantOpen: (open: boolean) => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Notification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Global loading
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  createdAt: number
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  aiAssistantOpen: false,
  setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),

  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 10),
    })),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}))
