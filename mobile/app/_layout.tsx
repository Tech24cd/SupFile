import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function AuthGuard() {
  const { hydrated, isAuthenticated, hydrate } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => { hydrate() }, [])

  useEffect(() => {
    if (!hydrated) return
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated() && !inAuth) router.replace('/(auth)/login')
    else if (isAuthenticated() && inAuth) router.replace('/(tabs)/files')
  }, [hydrated, isAuthenticated()])

  return null
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={qc}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
