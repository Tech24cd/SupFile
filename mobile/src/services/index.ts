import api, { API_URL } from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as DocumentPicker from 'expo-document-picker'
import type { FileItem, Folder, TrashItem } from '../types'

export const authService = {
  register: (email: string, username: string, password: string) =>
    api.post('/api/auth/register', { email, username, password }),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),
  me: () => api.get('/api/auth/me'),
}

export const fileService = {
  list: (folderId?: string) =>
    api.get<{ files: FileItem[] }>('/api/files', { params: { folderId } }),

  upload: async (folderId: string | null, onProgress?: (pct: number) => void) => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
    if (result.canceled) return null
    const asset = result.assets[0]
    const form = new FormData()
    form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as any)
    return api.post<{ file: FileItem }>('/api/files/upload', form, {
      params: folderId ? { folderId } : {},
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total)) },
    })
  },

  previewUrl: async (id: string) => {
    const token = await AsyncStorage.getItem('accessToken')
    return `${API_URL}/api/files/${id}/preview?token=${token}`
  },

  rename: (id: string, name: string) => api.patch(`/api/files/${id}/rename`, { name }),
  move: (id: string, folderId: string | null) => api.patch(`/api/files/${id}/move`, { folderId }),
  delete: (id: string) => api.delete(`/api/files/${id}`),
  trash: () => api.get<{ items: TrashItem[] }>('/api/files/trash'),
  restore: (trashId: string) => api.post(`/api/files/trash/${trashId}/restore`),
  deletePermanently: (trashId: string) => api.delete(`/api/files/trash/${trashId}`),
}

export const folderService = {
  list: (parentId?: string) =>
    api.get<{ folders: Folder[] }>('/api/folders', { params: { parentId } }),
  create: (name: string, parentId?: string | null) =>
    api.post<{ folder: Folder }>('/api/folders', { name, parentId }),
  rename: (id: string, name: string) => api.patch(`/api/folders/${id}/rename`, { name }),
  delete: (id: string) => api.delete(`/api/folders/${id}`),
}

export const dashboardService = {
  get: () => api.get('/api/dashboard'),
}

export const searchService = {
  search: (q: string, type?: string, since?: string) =>
    api.get('/api/search', { params: { q, type, since } }),
}

export const shareService = {
  create: (data: { fileId?: string; folderId?: string; password?: string; expiresAt?: string }) =>
    api.post('/api/share', data),
  list: () => api.get('/api/share'),
  delete: (token: string) => api.delete(`/api/share/${token}`),
}

export const userService = {
  profile: () => api.get('/api/user/profile'),
  updateProfile: (data: { username?: string; email?: string }) =>
    api.patch('/api/user/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/user/change-password', { currentPassword, newPassword }),
  setTheme: (theme: 'LIGHT' | 'DARK') => api.patch('/api/user/theme', { theme }),
}
