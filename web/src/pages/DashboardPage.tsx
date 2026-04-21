import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, HardDrive } from 'lucide-react'
import { dashboardService } from '../services'
import { formatBytes, formatDate, getFileIcon } from '../utils/files'
import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
  })

  const d = data?.data
  const usedBytes = Number(d?.quota?.used ?? user?.usedBytes ?? 0)
  const totalBytes = Number(d?.quota?.total ?? user?.quotaBytes ?? 1)
  const usedPct = Math.min(100, (usedBytes / totalBytes) * 100)

  const breakdown = d?.breakdown
    ? Object.entries(d.breakdown).map(([name, value]) => ({ name, value: Number(value) }))
    : []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Quota */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-5 h-5 text-brand-500" />
          <h2 className="font-medium text-gray-900 dark:text-white">Espace de stockage</h2>
        </div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">{formatBytes(usedBytes)} utilisés</span>
          <span className="text-gray-500">{formatBytes(totalBytes)} total</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{usedPct.toFixed(1)}% utilisé</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition */}
        {breakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-medium text-gray-900 dark:text-white mb-4">Répartition</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={breakdown} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBytes(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1 min-w-0">
                {breakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">{formatBytes(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fichiers récents */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-medium text-gray-900 dark:text-white">Récents</h2>
          </div>
          <div className="space-y-3">
            {(d?.recentFiles ?? []).map((file: any) => {
              const Icon = getFileIcon(file.mimeType)
              return (
                <Link
                  key={file.id}
                  to={file.folderId ? `/files/${file.folderId}` : '/files'}
                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -mx-1.5 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{file.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(file.updatedAt)}</span>
                </Link>
              )
            })}
            {(!d?.recentFiles || d.recentFiles.length === 0) && (
              <p className="text-sm text-gray-400">Aucun fichier récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
