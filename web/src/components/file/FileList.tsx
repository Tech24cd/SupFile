import { useNavigate } from 'react-router-dom'
import { Folder as FolderIcon, Download, Trash2, Eye, Share2, Pencil, FolderInput } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FileItem, Folder } from '../../types'
import { fileService, folderService } from '../../services'
import { formatBytes, formatDate, getFileIcon } from '../../utils/files'
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

export default function FileList({ files, folders, currentFolderId, onPreview, onDeleteFile, onDeleteFolder }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['files', currentFolderId] })
    qc.invalidateQueries({ queryKey: ['folders', currentFolderId] })
  }

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
            <FolderRow
              key={folder.id}
              folder={folder}
              currentFolderId={currentFolderId}
              onOpen={() => navigate(`/files/${folder.id}`)}
              onDelete={() => onDeleteFolder(folder.id)}
              onRefresh={invalidate}
            />
          ))}
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              currentFolderId={currentFolderId}
              onPreview={() => onPreview(file)}
              onDelete={() => onDeleteFile(file.id)}
              onRefresh={invalidate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FolderRow({ folder, currentFolderId, onOpen, onDelete, onRefresh }: {
  folder: Folder; currentFolderId?: string; onOpen: () => void; onDelete: () => void; onRefresh: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [moving, setMoving] = useState(false)
  const [sharing, setSharing] = useState(false)

  return (
    <>
      <tr onDoubleClick={onOpen} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
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
            <button onClick={(e) => { e.stopPropagation(); setRenaming(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setMoving(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><FolderInput className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setSharing(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Share2 className="w-3.5 h-3.5" /></button>
            <a href={folderService.downloadUrl(folder.id)} download onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Download className="w-3.5 h-3.5" /></a>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
      {renaming && <RenameModal currentName={folder.name} type="folder" onClose={() => setRenaming(false)} onRename={async (n) => { await folderService.rename(folder.id, n); onRefresh() }} />}
      {moving && <MoveModal itemName={folder.name} type="folder" currentFolderId={currentFolderId ?? null} excludeId={folder.id} onClose={() => setMoving(false)} onMove={async (t) => { await folderService.move(folder.id, t); onRefresh() }} />}
      {sharing && <ShareModal item={folder} type="folder" onClose={() => setSharing(false)} />}
    </>
  )
}

function FileRow({ file, currentFolderId, onPreview, onDelete, onRefresh }: {
  file: FileItem; currentFolderId?: string; onPreview: () => void; onDelete: () => void; onRefresh: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [moving, setMoving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const Icon = getFileIcon(file.mimeType)

  return (
    <>
      <tr onDoubleClick={onPreview} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
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
            <button onClick={(e) => { e.stopPropagation(); onPreview() }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setRenaming(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setMoving(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><FolderInput className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setSharing(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Share2 className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); fileService.download(file.id, file.name) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Download className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
      {renaming && <RenameModal currentName={file.name} type="file" onClose={() => setRenaming(false)} onRename={async (n) => { await fileService.rename(file.id, n); onRefresh() }} />}
      {moving && <MoveModal itemName={file.name} type="file" currentFolderId={currentFolderId ?? null} onClose={() => setMoving(false)} onMove={async (t) => { await fileService.move(file.id, t); onRefresh() }} />}
      {sharing && <ShareModal item={file} type="file" onClose={() => setSharing(false)} />}
    </>
  )
}
