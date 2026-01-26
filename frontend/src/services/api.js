import axios from 'axios'
import { API_CONFIG } from '@/utils/config'
import { getToken, setToken, isTokenValid, getCurrentUser } from '@/utils/auth'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})











api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes('/auth/')
    
    if (!isAuthEndpoint) {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

const generateFreshToken = async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) throw new Error('No current user')
  
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/generate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentUser)
  })
  
  if (!response.ok) throw new Error('Token generation failed')
  const data = await response.json()
  return data.token
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const newToken = await generateFreshToken()
        setToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Land Titles API
export const landTitlesAPI = {
  getAll: () => api.get('/land-titles'),
  getById: (id) => api.get(`/land-titles/${id}`),
  create: (data) => {
    return api.post('/land-titles', data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    })
  },
  validate: (titleNumber) => api.get(`/land-titles/validate/${titleNumber}`),
}

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  confirm: (id) => api.put(`/payments/${id}/confirm`),
  cancel: (id) => api.put(`/payments/${id}/cancel`),
  getStatus: (id) => api.get(`/payments/${id}/status`),
}

// Transfers API
export const transfersAPI = {
  getAll: () => api.get('/transfers'),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  update: (id, data) => api.put(`/transfers/${id}`, data),
  complete: (id, paymentId) => api.put(`/transfers/${id}/complete`, { payment_id: paymentId }),
  updateStatus: (id, status) => api.put(`/transfers/${id}/status`, { status }),
  delete: (id) => api.delete(`/transfers/${id}`),
}

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          setToken(data.token)
        }
        return { ok: true, data }
      }
      
      const errorData = await response.json()
      return { ok: false, error: errorData }
    } catch (error) {
      return { ok: false, error: { message: error.message } }
    }
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  },
  register: (userData) => {
    return fetch(`${API_CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
  }
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
}

export default api