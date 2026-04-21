import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Folder, ChevronRight, Home } from 'lucide-react'
import { folderService } from '../../services'
import type { Folder as FolderType } from '../../types'

interface Props {
  itemName: string
  type: 'file' | 'folder'
  currentFolderId: string | null
  excludeId?: string // pour éviter de déplacer un dossier dans lui-même
  onClose: () => void
  onMove: (targetFolderId: string | null) => Promise<void>
}

export default function MoveModal({ itemName, type, currentFolderId, excludeId, onClose, onMove }: Props) {
  const [browsing, setBrowsing] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [path, setPath] = useState<{ id: string; name: string }[]>([])

  const { data } = useQuery({
    queryKey: ['folders-browse', browsing],
    queryFn: () => folderService.list(browsing),
  })

  const folders = (data?.data?.folders ?? []).filter(
    (f: FolderType) => f.id !== excludeId && f.id !== currentFolderId
  )

  const navigateTo = (folder: FolderType) => {
    setBrowsing(folder.id)
    setPath((p) => [...p, { id: folder.id, name: folder.name }])
  }

  const navigateBack = (index: number) => {
    const newPath = path.slice(0, index)
    setPath(newPath)
    setBrowsing(newPath.length > 0 ? newPath[newPath.length - 1].id : undefined)
  }

  const handleMove = async (targetId: string | null) => {
    setLoading(true)
    try {
      await onMove(targetId)
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Déplacer</h2>
            <p className="text-xs text-gray-500 truncate max-w-[220px]">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-6 py-3 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => navigateBack(0)} className="hover:text-brand-600 flex items-center gap-1">
            <Home className="w-3 h-3" /> Racine
          </button>
          {path.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigateBack(i + 1)} className="hover:text-brand-600">{p.name}</button>
            </span>
          ))}
        </div>

        {/* Liste dossiers */}
        <div className="max-h-60 overflow-y-auto py-2">
          {folders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun sous-dossier</p>
          ) : (
            folders.map((folder: FolderType) => (
              <button
                key={folder.id}
                onClick={() => navigateTo(folder)}
                className="flex items-center gap-3 w-full px-6 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Folder className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{folder.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => handleMove(browsing ?? null)}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {loading ? 'Déplacement...' : 'Déplacer ici'}
          </button>
        </div>
      </div>
    </div>
  )
}
