import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const error = params.get('error')

    if (error || !accessToken || !refreshToken) {
      navigate('/login?error=oauth_failed')
      return
    }

    // On a les tokens, on récupère le profil
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)

    authService.me()
      .then(({ data }) => {
        setAuth(data.user, accessToken, refreshToken)
        navigate('/files')
      })
      .catch(() => navigate('/login?error=oauth_failed'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-500 dark:text-gray-400 text-sm">Connexion en cours...</p>
    </div>
  )
}
