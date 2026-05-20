import { useColorScheme } from 'react-native'
import { useAuthStore } from '../stores/authStore'
import { darkTheme, lightTheme } from '../utils/colors'

export function useTheme() {
  const systemScheme = useColorScheme()
  const userTheme = useAuthStore((s) => s.user?.theme)
  const isDark = userTheme === 'DARK' || (userTheme === undefined && systemScheme === 'dark')
  return { isDark, theme: isDark ? darkTheme : lightTheme }
}
