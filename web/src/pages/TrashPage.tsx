import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { fileService } from '../services'
import { formatDate, getFileIcon } from '../utils/files'
import { Folder as FolderIcon } from 'lucide-react'

export default function TrashPage() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['trash'],
    queryFn: fileService.trash,
  })

  const restore = useMutation({
    mutationFn: (id: string) => fileService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  })

  const deletePerm = useMutation({
    mutationFn: (id: string) => fileService.deletePermanently(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  })

  const items = data?.data?.items ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Trash2 className="w-5 h-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Corbeille</h1>
        {items.length > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">La corbeille est vide</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Les éléments supprimés définitivement ne peuvent pas être récupérés.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Supprimé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => {
                  const isFile = !!item.file
                  const name = item.file?.name ?? item.folder?.name ?? '?'
                  const Icon = isFile ? getFileIcon(item.file!.mimeType) : FolderIcon

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-400">
                        {formatDate(item.deletedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => restore.mutate(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restaurer
                          </button>
                          <button
                            onClick={() => deletePerm.mutate(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
