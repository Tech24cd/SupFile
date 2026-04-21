import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  currentName: string
  type: 'file' | 'folder'
  onClose: () => void
  onRename: (newName: string) => Promise<void>
}

export default function RenameModal({ currentName, type, onClose, onRename }: Props) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name === currentName) return
    setLoading(true)
    setError('')
    try {
      await onRename(name.trim())
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors du renommage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Renommer {type === 'file' ? 'le fichier' : 'le dossier'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || name === currentName}
              className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {loading ? 'Renommage...' : 'Renommer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
