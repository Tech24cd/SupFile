import { useNavigate } from 'react-router-dom'
import { Folder as FolderIcon, MoreVertical, Download, Trash2, Eye, Share2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { FileItem, Folder } from '../../types'
import { fileService, folderService } from '../../services'
import { formatBytes, getFileIcon } from '../../utils/files'

interface Props {
  files: FileItem[]
  folders: Folder[]
  onPreview: (file: FileItem) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
}

export default function FileGrid({ files, folders, onPreview, onDeleteFile, onDeleteFolder }: Props) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onOpen={() => navigate(`/files/${folder.id}`)}
          onDelete={() => onDeleteFolder(folder.id)}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onPreview={() => onPreview(file)}
          onDelete={() => onDeleteFile(file.id)}
        />
      ))}
    </div>
  )
}

function FolderCard({ folder, onOpen, onDelete }: { folder: Folder; onOpen: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
      <div onDoubleClick={onOpen} className="flex flex-col items-center gap-2 w-full">
        <FolderIcon className="w-12 h-12 text-brand-500 fill-brand-100 dark:fill-brand-900/50" strokeWidth={1.5} />
        <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full">{folder.name}</span>
        {folder._count && (
          <span className="text-xs text-gray-400">{folder._count.files} fichiers</span>
        )}
      </div>

      <div ref={menuRef} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-20 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-sm">
            <button
              onClick={() => { onOpen(); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FolderIcon className="w-3.5 h-3.5" /> Ouvrir
            </button>
            <a
              href={folderService.downloadUrl(folder.id)}
              download
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen(false)}
            >
              <Download className="w-3.5 h-3.5" /> Télécharger ZIP
            </a>
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FileCard({ file, onPreview, onDelete }: { file: FileItem; onPreview: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const Icon = getFileIcon(file.mimeType)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isImage = file.mimeType.startsWith('image/')

  return (
    <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
      <div onDoubleClick={onPreview} className="flex flex-col items-center gap-2 w-full">
        {isImage ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={fileService.previewUrl(file.id)}
              alt={file.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <Icon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
        )}
        <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full">{file.name}</span>
        <span className="text-xs text-gray-400">{formatBytes(Number(file.sizeBytes))}</span>
      </div>

      <div ref={menuRef} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-20 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-sm">
            <button
              onClick={() => { onPreview(); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Eye className="w-3.5 h-3.5" /> Aperçu
            </button>
            <button
              onClick={() => { fileService.download(file.id, file.name); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
