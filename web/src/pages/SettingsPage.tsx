import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { userService } from '../services'
import { Settings, Moon, Sun, Lock, User } from 'lucide-react'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await userService.updateProfile({ username, email })
      setUser(data.user)
      setProfileMsg('Profil mis à jour ✓')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileMsg(err.response?.data?.error ?? 'Erreur')
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await userService.changePassword(currentPwd, newPwd)
      setPwdMsg('Mot de passe mis à jour ✓')
      setCurrentPwd(''); setNewPwd('')
      setTimeout(() => setPwdMsg(''), 3000)
    } catch (err: any) {
      setPwdMsg(err.response?.data?.error ?? 'Erreur')
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Paramètres</h1>
      </div>

      {/* Profil */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="font-medium text-gray-900 dark:text-white">Profil</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom d'utilisateur</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {profileMsg && <p className="text-sm text-green-500">{profileMsg}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Enregistrer
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="font-medium text-gray-900 dark:text-white">Mot de passe</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {pwdMsg && <p className="text-sm text-green-500">{pwdMsg}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Changer
          </button>
        </form>
      </div>

      {/* Thème */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-gray-400" />}
            <h2 className="font-medium text-gray-900 dark:text-white">Thème</h2>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
          </button>
        </div>
      </div>
    </div>
  )
}
