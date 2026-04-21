export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
  theme: 'LIGHT' | 'DARK'
  quotaBytes: string
  usedBytes: string
}

export interface FileItem {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  folderId: string | null
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  _count?: { files: number; children: number }
}

export interface ShareLink {
  id: string
  token: string
  fileId: string | null
  folderId: string | null
  expiresAt: string | null
  passwordHash: string | null
  accessCount: number
  createdAt: string
  file?: { id: string; name: string; mimeType: string } | null
  folder?: { id: string; name: string } | null
}

export interface TrashItem {
  id: string
  fileId: string | null
  folderId: string | null
  deletedAt: string
  file?: FileItem | null
  folder?: Folder | null
}

export interface BreadcrumbItem {
  id: string
  name: string
}
