import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      if (!refreshToken) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        await AsyncStorage.setItem('accessToken', data.accessToken)
        await AsyncStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
