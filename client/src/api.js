import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle responses
api.interceptors.response.use((response) => {
  return response
}, (error) => {
  const isLoginRequest = error.config?.url?.includes('/auth/login')
  // Hanya redirect saat 401 pada request terautentikasi, bukan pada login gagal
  if (error.response?.status === 401 && !isLoginRequest) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
  return Promise.reject(error)
})

export default api