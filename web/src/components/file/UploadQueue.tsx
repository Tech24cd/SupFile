import { useUIStore } from '../../stores/uiStore'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function UploadQueue() {
  const { uploads, removeUpload } = useUIStore()

  if (uploads.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg px-4 py-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{upload.filename}</p>
            {upload.done && (
              <button onClick={() => removeUpload(upload.id)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {upload.error ? (
            <div className="flex items-center gap-1.5 text-red-500 text-xs">
              <XCircle className="w-3.5 h-3.5" />
              {upload.error}
            </div>
          ) : upload.done ? (
            <div className="flex items-center gap-1.5 text-green-500 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              Upload terminé
            </div>
          ) : (
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">{upload.progress}%</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
