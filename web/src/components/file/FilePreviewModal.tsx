import { X, Download, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FileItem } from '../../types'
import { fileService } from '../../services'
import { formatBytes, formatDate, getMimeCategory } from '../../utils/files'

interface Props {
  file: FileItem
  onClose: () => void
}

export default function FilePreviewModal({ file, onClose }: Props) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const previewUrl = fileService.previewUrl(file.id)
  const category = getMimeCategory(file.mimeType)

  // Ferme avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Charge le texte pour les fichiers texte
  useEffect(() => {
    if (category === 'text') {
      fetch(previewUrl)
        .then((r) => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Impossible de charger le fichier'))
    }
  }, [category, previewUrl])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{file.name}</p>
          <p className="text-gray-400 text-xs">{formatBytes(Number(file.sizeBytes))} · {formatDate(file.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <button
            onClick={() => fileService.download(file.id, file.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {category === 'image' && (
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}

        {category === 'video' && (
          <video
            src={previewUrl}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg"
          />
        )}

        {category === 'audio' && (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-600/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎵</span>
            </div>
            <p className="text-white font-medium mb-4">{file.name}</p>
            <audio src={previewUrl} controls autoPlay className="w-full max-w-sm" />
          </div>
        )}

        {category === 'pdf' && (
          <iframe
            src={previewUrl}
            title={file.name}
            className="w-full h-full rounded-lg bg-white"
            style={{ minHeight: '70vh' }}
          />
        )}

        {category === 'text' && (
          <div className="w-full max-w-3xl bg-gray-900 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="text-gray-400 text-xs font-mono">{file.name}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <pre className="p-4 text-gray-300 text-sm font-mono overflow-auto max-h-[70vh] whitespace-pre-wrap">
              {textContent ?? 'Chargement...'}
            </pre>
          </div>
        )}

        {category === 'other' && (
          <div className="text-center text-white">
            <p className="text-lg mb-2">Aperçu non disponible</p>
            <p className="text-gray-400 text-sm mb-4">{file.mimeType}</p>
            <button
              onClick={() => fileService.download(file.id, file.name)}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
