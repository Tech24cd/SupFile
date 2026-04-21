import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { FolderPlus, Upload, Grid, List } from 'lucide-react'
import { fileService, folderService } from '../services'
import { useUIStore } from '../stores/uiStore'
import Breadcrumb from '../components/file/Breadcrumb'
import FileGrid from '../components/file/FileGrid'
import FileList from '../components/file/FileList'
import NewFolderModal from '../components/file/NewFolderModal'
import FilePreviewModal from '../components/file/FilePreviewModal'
import type { FileItem, Folder } from '../types'
import { nanoid } from '../utils/nanoid'

export default function FilesPage() {
  const { folderId } = useParams<{ folderId?: string }>()
  const qc = useQueryClient()
  const { addUpload, updateUpload } = useUIStore()

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [preview, setPreview] = useState<FileItem | null>(null)

  const { data: filesData } = useQuery({
    queryKey: ['files', folderId],
    queryFn: () => fileService.list(folderId),
  })

  const { data: foldersData } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => folderService.list(folderId),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['files', folderId] })
    qc.invalidateQueries({ queryKey: ['folders', folderId] })
  }

  const uploadFile = async (file: File) => {
    const id = nanoid()
    addUpload(id, file.name)
    try {
      await fileService.upload(file, folderId ?? null, (pct) => updateUpload(id, pct))
      updateUpload(id, 100, true)
      invalidate()
      setTimeout(() => useUIStore.getState().removeUpload(id), 2000)
    } catch {
      updateUpload(id, 0, true, 'Erreur upload')
    }
  }

  const onDrop = useCallback((files: File[]) => {
    files.forEach(uploadFile)
  }, [folderId])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  })

  const deleteFile = useMutation({
    mutationFn: (id: string) => fileService.delete(id),
    onSuccess: invalidate,
  })

  const deleteFolder = useMutation({
    mutationFn: (id: string) => folderService.delete(id),
    onSuccess: invalidate,
  })

  const files = filesData?.data?.files ?? []
  const folders = foldersData?.data?.folders ?? []
  const isEmpty = files.length === 0 && folders.length === 0

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col h-full p-6 ${isDragActive ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Breadcrumb folderId={folderId} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Dossier
          </button>
          <button
            onClick={open}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer
          </button>
        </div>
      </div>

      {/* Zone de drop visible */}
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-brand-600/90 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-xl">
            Déposer les fichiers ici
          </div>
        </div>
      )}

      {/* Contenu */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Dossier vide</p>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Glisse des fichiers ici ou clique sur Importer</p>
        </div>
      ) : view === 'grid' ? (
        <FileGrid
          files={files}
          folders={folders}
          onPreview={setPreview}
          onDeleteFile={(id) => deleteFile.mutate(id)}
          onDeleteFolder={(id) => deleteFolder.mutate(id)}
        />
      ) : (
        <FileList
          files={files}
          folders={folders}
          onPreview={setPreview}
          onDeleteFile={(id) => deleteFile.mutate(id)}
          onDeleteFolder={(id) => deleteFolder.mutate(id)}
        />
      )}

      {newFolderOpen && (
        <NewFolderModal
          parentId={folderId ?? null}
          onClose={() => setNewFolderOpen(false)}
          onCreated={invalidate}
        />
      )}

      {preview && (
        <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
