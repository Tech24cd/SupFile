import { create } from 'zustand'

interface UploadItem {
  id: string
  filename: string
  progress: number
  done: boolean
  error?: string
}

interface UIStore {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
  uploads: UploadItem[]
  addUpload: (id: string, filename: string) => void
  updateUpload: (id: string, progress: number, done?: boolean, error?: string) => void
  removeUpload: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return { theme: next }
    }),

  setTheme: (t) => {
    localStorage.setItem('theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    set({ theme: t })
  },

  uploads: [],

  addUpload: (id, filename) =>
    set((s) => ({
      uploads: [...s.uploads, { id, filename, progress: 0, done: false }],
    })),

  updateUpload: (id, progress, done = false, error) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.id === id ? { ...u, progress, done, error } : u
      ),
    })),

  removeUpload: (id) =>
    set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) })),
}))
