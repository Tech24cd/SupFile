import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import { folderService } from '../../services'

interface Props {
  folderId?: string
}

export default function Breadcrumb({ folderId }: Props) {
  const { data } = useQuery({
    queryKey: ['breadcrumb', folderId],
    queryFn: () => folderService.breadcrumb(folderId!),
    enabled: !!folderId,
  })

  const crumbs = data?.data?.breadcrumb ?? []

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/files"
        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link
            to={`/files/${crumb.id}`}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {crumb.name}
          </Link>
        </span>
      ))}
    </nav>
  )
}
