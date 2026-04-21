import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Share2, Copy, Trash2, Plus, Check, Lock, Calendar } from 'lucide-react'
import { useState } from 'react'
import { shareService } from '../services'
import { formatDate } from '../utils/files'

export default function SharePage() {
  const qc = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ['shares'],
    queryFn: shareService.list,
  })

  const deleteLink = useMutation({
    mutationFn: (token: string) => shareService.delete(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares'] }),
  })

  const links = data?.data?.links ?? []

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/s/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="w-5 h-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Partages</h1>
      </div>

      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Pour partager un fichier, fais un clic droit dessus dans le gestionnaire de fichiers.
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Share2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun lien de partage actif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const name = link.file?.name ?? link.folder?.name ?? 'Élément'
            const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false

            return (
              <div
                key={link.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isExpired
                    ? 'border-gray-100 dark:border-gray-800 opacity-60'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {link.passwordHash && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Lock className="w-3 h-3" /> Protégé
                      </span>
                    )}
                    {link.expiresAt && (
                      <span className={`flex items-center gap-1 text-xs ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {isExpired ? 'Expiré' : `Expire ${formatDate(link.expiresAt)}`}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{link.accessCount} accès</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyLink(link.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {copied === link.token ? (
                      <><Check className="w-3 h-3 text-green-500" /> Copié</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copier</>
                    )}
                  </button>
                  <button
                    onClick={() => deleteLink.mutate(link.token)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
