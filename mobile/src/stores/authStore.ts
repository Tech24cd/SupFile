import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  setUser: (user: User) => void
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ])
    set({ user, accessToken, refreshToken })
  },

  setUser: (user) => {
    AsyncStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({ user: null, accessToken: null, refreshToken: null })
  },

  hydrate: async () => {
    try {
      const [[, token], [, refresh], [, userStr]] = await AsyncStorage.multiGet([
        'accessToken', 'refreshToken', 'user',
      ])
      set({
        accessToken: token,
        refreshToken: refresh,
        user: userStr ? JSON.parse(userStr) : null,
        hydrated: true,
      })
    } catch {
      set({ hydrated: true })
    }
  },

  isAuthenticated: () => !!get().accessToken && !!get().user,
}))
