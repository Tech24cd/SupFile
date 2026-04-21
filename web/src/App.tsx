import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import FilesPage from './pages/FilesPage'
import DashboardPage from './pages/DashboardPage'
import TrashPage from './pages/TrashPage'
import SharePage from './pages/SharePage'
import PublicSharePage from './pages/PublicSharePage'
import SettingsPage from './pages/SettingsPage'
import SearchPage from './pages/SearchPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/s/:token" element={<PublicSharePage />} />

        {/* Privé — avec Layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/files" replace />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="files/:folderId" element={<FilesPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="share" element={<SharePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
