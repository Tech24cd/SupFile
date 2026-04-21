import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Lock, HardDrive, AlertCircle } from 'lucide-react'
import { shareService } from '../services'
import { formatBytes, getFileIcon } from '../utils/files'

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>()
  const [needsPassword, setNeedsPassword] = useState(false)

  const { data, error, isLoading } = useQuery({
    queryKey: ['public-share', token, submittedPassword],
    queryFn: () => shareService.getPublic(token!, submittedPassword),
    enabled: !!token && (!needsPassword || !!submittedPassword),
    retry: false,
    onError: (err: any) => {
      if (err.response?.data?.protected) setNeedsPassword(true)
    },
  } as any)

  const link = data?.data?.link
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const downloadUrl = `${apiBase}/api/share/public/${token}/download${submittedPassword ? `?password=${submittedPassword}` : ''}`

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    )
  }

  const errorMsg = (error as any)?.response?.data?.error

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="flex items-center gap-2 mb-8">
        <HardDrive className="w-6 h-6 text-brand-600" />
        <span className="text-xl font-bold text-brand-600">SUPFile</span>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        {/* Mot de passe requis */}
        {needsPassword && !link && (
          <div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/20 mx-auto mb-4">
              <Lock className="w-5 h-5 text-brand-600" />
            </div>
            <h1 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-1">Lien protégé</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Un mot de passe est requis pour accéder à ce contenu.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedPassword(password) }} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errorMsg && !errorMsg.includes('requis') && (
                <p className="text-xs text-red-500">{errorMsg}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Accéder
              </button>
            </form>
          </div>
        )}

        {/* Erreur (expiré, introuvable…) */}
        {!needsPassword && errorMsg && (
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Contenu accessible */}
        {link && (
          <div className="text-center">
            {link.file && (() => {
              const Icon = getFileIcon(link.file.mimeType)
              return (
                <>
                  <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="font-medium text-gray-900 dark:text-white mb-1 truncate">{link.file.name}</p>
                  <p className="text-xs text-gray-400 mb-6">{link.file.mimeType}</p>
                </>
              )
            })()}

            {link.folder && (
              <>
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-3">
                  <HardDrive className="w-6 h-6 text-brand-500" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">{link.folder.name}</p>
                <p className="text-xs text-gray-400 mb-6">Dossier compressé en ZIP</p>
              </>
            )}

            <a
              href={downloadUrl}
              download
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
