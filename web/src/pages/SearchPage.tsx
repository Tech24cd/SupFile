import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter } from 'lucide-react'
import { searchService, fileService } from '../services'
import { getFileIcon, formatBytes, formatDate } from '../utils/files'
import FilePreviewModal from '../components/file/FilePreviewModal'
import type { FileItem } from '../types'
import { useNavigate } from 'react-router-dom'
import { Folder as FolderIcon } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'audio', label: 'Audio' },
  { value: 'pdf', label: 'PDF' },
  { value: 'text', label: 'Textes' },
]

const SINCE_OPTIONS = [
  { value: '', label: 'Toutes dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
]

export default function SearchPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [since, setSince] = useState('')
  const [preview, setPreview] = useState<FileItem | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { data, isFetching } = useQuery({
    queryKey: ['search', q, type, since],
    queryFn: () => searchService.search(q, type || undefined, since || undefined),
    enabled: submitted && (!!q || !!type || !!since),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const files = data?.data?.files ?? []
  const folders = data?.data?.folders ?? []
  const total = files.length + folders.length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-5 h-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Recherche</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un fichier ou dossier..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SINCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </form>

      {isFetching && <p className="text-sm text-gray-400">Recherche...</p>}

      {submitted && !isFetching && total === 0 && (
        <p className="text-sm text-gray-400">Aucun résultat trouvé</p>
      )}

      {total > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 mb-3">{total} résultat{total > 1 ? 's' : ''}</p>

          {folders.map((folder: any) => (
            <div
              key={folder.id}
              onClick={() => navigate(`/files/${folder.id}`)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <FolderIcon className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{folder.name}</span>
              <span className="text-xs text-gray-400">{formatDate(folder.updatedAt)}</span>
            </div>
          ))}

          {files.map((file: FileItem) => {
            const Icon = getFileIcon(file.mimeType)
            return (
              <div
                key={file.id}
                onClick={() => setPreview(file)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatBytes(Number(file.sizeBytes))}</span>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatDate(file.updatedAt)}</span>
              </div>
            )
          })}
        </div>
      )}

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
