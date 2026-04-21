import { useNavigate } from 'react-router-dom'
import { Folder as FolderIcon, MoreVertical, Download, Trash2, Eye, Share2, Pencil, FolderInput } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FileItem, Folder } from '../../types'
import { fileService, folderService } from '../../services'
import { formatBytes, getFileIcon } from '../../utils/files'
import RenameModal from './RenameModal'
import MoveModal from './MoveModal'
import ShareModal from './ShareModal'

interface Props {
  files: FileItem[]
  folders: Folder[]
  currentFolderId?: string
  onPreview: (file: FileItem) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
}

export default function FileGrid({ files, folders, currentFolderId, onPreview, onDeleteFile, onDeleteFolder }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['files', currentFolderId] })
    qc.invalidateQueries({ queryKey: ['folders', currentFolderId] })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          currentFolderId={currentFolderId}
          onOpen={() => navigate(`/files/${folder.id}`)}
          onDelete={() => onDeleteFolder(folder.id)}
          onRefresh={invalidate}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          currentFolderId={currentFolderId}
          onPreview={() => onPreview(file)}
          onDelete={() => onDeleteFile(file.id)}
          onRefresh={invalidate}
        />
      ))}
    </div>
  )
}

function FolderCard({ folder, currentFolderId, onOpen, onDelete, onRefresh }: {
  folder: Folder; currentFolderId?: string; onOpen: () => void; onDelete: () => void; onRefresh: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [moving, setMoving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <>
      <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
        <div onDoubleClick={onOpen} className="flex flex-col items-center gap-2 w-full">
          <FolderIcon className="w-12 h-12 text-brand-500 fill-brand-100 dark:fill-brand-900/50" strokeWidth={1.5} />
          <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full">{folder.name}</span>
          {folder._count && <span className="text-xs text-gray-400">{folder._count.files} fichiers</span>}
        </div>
        <div ref={menuRef} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-sm">
              <button onClick={() => { onOpen(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><FolderIcon className="w-3.5 h-3.5" /> Ouvrir</button>
              <button onClick={() => { setRenaming(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Pencil className="w-3.5 h-3.5" /> Renommer</button>
              <button onClick={() => { setMoving(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><FolderInput className="w-3.5 h-3.5" /> Déplacer</button>
              <button onClick={() => { setSharing(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Share2 className="w-3.5 h-3.5" /> Partager</button>
              <a href={folderService.downloadUrl(folder.id)} download onClick={() => setMenuOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Download className="w-3.5 h-3.5" /> ZIP</a>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /> Supprimer</button>
            </div>
          )}
        </div>
      </div>
      {renaming && <RenameModal currentName={folder.name} type="folder" onClose={() => setRenaming(false)} onRename={async (n) => { await folderService.rename(folder.id, n); onRefresh() }} />}
      {moving && <MoveModal itemName={folder.name} type="folder" currentFolderId={currentFolderId ?? null} excludeId={folder.id} onClose={() => setMoving(false)} onMove={async (t) => { await folderService.move(folder.id, t); onRefresh() }} />}
      {sharing && <ShareModal item={folder} type="folder" onClose={() => setSharing(false)} />}
    </>
  )
}

function FileCard({ file, currentFolderId, onPreview, onDelete, onRefresh }: {
  file: FileItem; currentFolderId?: string; onPreview: () => void; onDelete: () => void; onRefresh: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [moving, setMoving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const Icon = getFileIcon(file.mimeType)
  const isImage = file.mimeType.startsWith('image/')

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <>
      <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
        <div onDoubleClick={onPreview} className="flex flex-col items-center gap-2 w-full">
          {isImage ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img src={fileService.previewUrl(file.id)} alt={file.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          ) : <Icon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
          <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full">{file.name}</span>
          <span className="text-xs text-gray-400">{formatBytes(Number(file.sizeBytes))}</span>
        </div>
        <div ref={menuRef} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-sm">
              <button onClick={() => { onPreview(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Eye className="w-3.5 h-3.5" /> Aperçu</button>
              <button onClick={() => { setRenaming(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Pencil className="w-3.5 h-3.5" /> Renommer</button>
              <button onClick={() => { setMoving(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><FolderInput className="w-3.5 h-3.5" /> Déplacer</button>
              <button onClick={() => { setSharing(true); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Share2 className="w-3.5 h-3.5" /> Partager</button>
              <button onClick={() => { fileService.download(file.id, file.name); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"><Download className="w-3.5 h-3.5" /> Télécharger</button>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /> Supprimer</button>
            </div>
          )}
        </div>
      </div>
      {renaming && <RenameModal currentName={file.name} type="file" onClose={() => setRenaming(false)} onRename={async (n) => { await fileService.rename(file.id, n); onRefresh() }} />}
      {moving && <MoveModal itemName={file.name} type="file" currentFolderId={currentFolderId ?? null} onClose={() => setMoving(false)} onMove={async (t) => { await fileService.move(file.id, t); onRefresh() }} />}
      {sharing && <ShareModal item={file} type="file" onClose={() => setSharing(false)} />}
    </>
  )
}
