import { useState } from 'react'
import { X, Copy, Check, Link, Users, Calendar, Lock } from 'lucide-react'
import { shareService } from '../../services'
import type { FileItem, Folder } from '../../types'

interface Props {
  item: FileItem | Folder
  type: 'file' | 'folder'
  onClose: () => void
}

export default function ShareModal({ item, type, onClose }: Props) {
  const [tab, setTab] = useState<'public' | 'internal'>('public')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [canWrite, setCanWrite] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const createPublicLink = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: any = {}
      if (type === 'file') payload.fileId = item.id
      else payload.folderId = item.id
      if (password) payload.password = password
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString()

      const { data } = await shareService.create(payload)
      const url = `${window.location.origin}/s/${data.link.token}`
      setGeneratedLink(url)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors de la création du lien')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareInternal = async () => {
    if (!targetEmail || type !== 'folder') return
    setLoading(true)
    setError('')
    try {
      await shareService.shareInternal(item.id, targetEmail, canWrite)
      setSuccess(`Dossier partagé avec ${targetEmail}`)
      setTargetEmail('')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erreur lors du partage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Partager</h2>
            <p className="text-xs text-gray-500 truncate max-w-[260px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setTab('public')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'public'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Link className="w-4 h-4" /> Lien public
          </button>
          {type === 'folder' && (
            <button
              onClick={() => setTab('internal')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === 'internal'
                  ? 'text-brand-600 border-b-2 border-brand-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4" /> Partage interne
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">{success}</p>
          )}

          {tab === 'public' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5" /> Mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide = pas de mot de passe"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date d'expiration (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {generatedLink ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none truncate"
                    />
                    <button onClick={copyLink} className="shrink-0 text-brand-600 hover:text-brand-700">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedLink('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Créer un nouveau lien
                  </button>
                </div>
              ) : (
                <button
                  onClick={createPublicLink}
                  disabled={loading}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Génération...' : 'Générer le lien'}
                </button>
              )}
            </>
          )}

          {tab === 'internal' && type === 'folder' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email de l'utilisateur
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="utilisateur@exemple.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canWrite}
                  onChange={(e) => setCanWrite(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Autoriser la modification</span>
              </label>
              <button
                onClick={shareInternal}
                disabled={loading || !targetEmail}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Partage...' : 'Partager'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
