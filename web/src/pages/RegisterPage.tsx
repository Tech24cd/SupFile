import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HardDrive } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email.includes('@')) e.email = 'Email invalide'
    if (form.username.length < 3) e.username = 'Min 3 caractères'
    if (form.password.length < 8) e.password = 'Min 8 caractères'
    if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      const { data } = await authService.register(form.email, form.username, form.password)
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate('/files')
    } catch (err: any) {
      const msg = err.response?.data?.error
      if (typeof msg === 'string') setErrors({ global: msg })
      else setErrors(msg || { global: 'Erreur lors de l\'inscription' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <HardDrive className="w-8 h-8 text-brand-600" />
          <span className="text-2xl font-bold text-brand-600">SUPFile</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Créer un compte</h1>

          {errors.global && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'email', label: 'Email', type: 'email', placeholder: 'toi@exemple.com' },
              { key: 'username', label: 'Nom d\'utilisateur', type: 'text', placeholder: 'monutilisateur' },
              { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
              { key: 'confirm', label: 'Confirmer le mot de passe', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  {...field(key as keyof typeof form)}
                />
                {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors mt-2"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
