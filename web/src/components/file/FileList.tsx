import { useNavigate } from 'react-router-dom'
import { Folder as FolderIcon, Download, Trash2, Eye } from 'lucide-react'
import type { FileItem, Folder } from '../../types'
import { fileService, folderService } from '../../services'
import { formatBytes, formatDate, getFileIcon } from '../../utils/files'

interface Props {
  files: FileItem[]
  folders: Folder[]
  onPreview: (file: FileItem) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
}

export default function FileList({ files, folders, onPreview, onDeleteFile, onDeleteFolder }: Props) {
  const navigate = useNavigate()

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            <th className="text-left px-4 py-3 font-medium">Nom</th>
            <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Taille</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Modifié</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {folders.map((folder) => (
            <tr
              key={folder.id}
              onDoubleClick={() => navigate(`/files/${folder.id}`)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="text-gray-900 dark:text-gray-100 truncate max-w-xs">{folder.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-gray-400">—</td>
              <td className="px-4 py-3 hidden md:table-cell text-gray-400">{formatDate(folder.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={folderService.downloadUrl(folder.id)}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType)
            return (
              <tr
                key={file.id}
                onDoubleClick={() => onPreview(file)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-xs">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{formatBytes(Number(file.sizeBytes))}</td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-400">{formatDate(file.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPreview(file) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); fileService.download(file.id, file.name) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
