import api from './api'
import type { FileItem, Folder, ShareLink, TrashItem, BreadcrumbItem } from '../types'

// ==============================
// AUTH
// ==============================

export const authService = {
  register: (email: string, username: string, password: string) =>
    api.post('/api/auth/register', { email, username, password }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),

  me: () => api.get('/api/auth/me'),

  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),
}

// ==============================
// FICHIERS
// ==============================

export const fileService = {
  list: (folderId?: string) =>
    api.get<{ files: FileItem[] }>('/api/files', { params: { folderId } }),

  upload: (
    file: File,
    folderId: string | null,
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ file: FileItem }>('/api/files/upload', form, {
      params: folderId ? { folderId } : {},
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
  },

  download: (id: string, filename: string) => {
    const token = localStorage.getItem('accessToken')
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/files/${id}/download`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    // On passe le token via un fetch pour déclencher le download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        a.href = URL.createObjectURL(blob)
        a.click()
        URL.revokeObjectURL(a.href)
      })
  },

  previewUrl: (id: string) => {
    const token = localStorage.getItem('accessToken')
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/files/${id}/preview?token=${token}`
  },

  rename: (id: string, name: string) =>
    api.patch(`/api/files/${id}/rename`, { name }),

  move: (id: string, folderId: string | null) =>
    api.patch(`/api/files/${id}/move`, { folderId }),

  delete: (id: string) => api.delete(`/api/files/${id}`),

  trash: () => api.get<{ items: TrashItem[] }>('/api/files/trash'),

  restore: (trashId: string) =>
    api.post(`/api/files/trash/${trashId}/restore`),

  deletePermanently: (trashId: string) =>
    api.delete(`/api/files/trash/${trashId}`),
}

// ==============================
// DOSSIERS
// ==============================

export const folderService = {
  list: (parentId?: string) =>
    api.get<{ folders: Folder[] }>('/api/folders', { params: { parentId } }),

  breadcrumb: (id: string) =>
    api.get<{ breadcrumb: BreadcrumbItem[] }>(`/api/folders/${id}/breadcrumb`),

  create: (name: string, parentId?: string | null) =>
    api.post<{ folder: Folder }>('/api/folders', { name, parentId }),

  rename: (id: string, name: string) =>
    api.patch(`/api/folders/${id}/rename`, { name }),

  move: (id: string, parentId: string | null) =>
    api.patch(`/api/folders/${id}/move`, { parentId }),

  delete: (id: string) => api.delete(`/api/folders/${id}`),

  downloadUrl: (id: string) => {
    const token = localStorage.getItem('accessToken')
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${base}/api/folders/${id}/download?token=${token}`
  },
}

// ==============================
// PARTAGE
// ==============================

export const shareService = {
  create: (data: { fileId?: string; folderId?: string; password?: string; expiresAt?: string }) =>
    api.post<{ link: ShareLink }>('/api/share', data),

  list: () => api.get<{ links: ShareLink[] }>('/api/share'),

  delete: (token: string) => api.delete(`/api/share/${token}`),

  getPublic: (token: string, password?: string) =>
    api.get(`/api/share/public/${token}`, { params: password ? { password } : {} }),

  shareInternal: (folderId: string, targetEmail: string, canWrite = false) =>
    api.post('/api/share/internal', { folderId, targetEmail, canWrite }),
}

// ==============================
// DASHBOARD
// ==============================

export const dashboardService = {
  get: () => api.get('/api/dashboard'),
}

// ==============================
// RECHERCHE
// ==============================

export const searchService = {
  search: (q: string, type?: string, since?: string) =>
    api.get('/api/search', { params: { q, type, since } }),
}

// ==============================
// USER
// ==============================

export const userService = {
  profile: () => api.get('/api/user/profile'),

  updateProfile: (data: { username?: string; email?: string }) =>
    api.patch('/api/user/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/user/change-password', { currentPassword, newPassword }),

  setTheme: (theme: 'LIGHT' | 'DARK') =>
    api.patch('/api/user/theme', { theme }),
}
