import axios from 'axios'

// API Gateway URL - Update this to match your backend
const API_BASE_URL = 'http://localhost:30081/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Set fresh token with role
if (typeof window !== 'undefined') {
  const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU'
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('token', newToken)
}

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const freshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU'
      config.headers.Authorization = `Bearer ${freshToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Land Titles API
export const landTitlesAPI = {
  getAll: () => api.get('/land-titles'),
  getById: (id) => api.get(`/land-titles/${id}`),
  create: (data) => {
    const freshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU'
    
    const directAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    })
    
    return directAxios.post('/land-titles', data)
  },
  validate: (titleNumber) => api.get(`/land-titles/validate/${titleNumber}`),
}

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  confirm: (id) => api.put(`/payments/${id}/confirm`),
  cancel: (id) => api.put(`/payments/${id}/cancel`),
  getStatus: (id) => api.get(`/payments/${id}/status`),
}

// Authentication API
export const authAPI = {
  login: (credentials) => {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })
  },
  register: (userData) => {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
  }
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
}

export default api