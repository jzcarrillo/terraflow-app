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

// Token management
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null
const setToken = (token) => typeof window !== 'undefined' && localStorage.setItem('token', token)

// CLEAR ALL CACHED TOKENS FUNCTION
const clearAllTokenCache = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Clear sessionStorage
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('authToken')
    
    // Clear axios default headers
    delete api.defaults.headers.common['Authorization']
    
    console.log('🗑️ All token cache cleared!')
    return true
  }
  return false
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.clearTokenCache = clearAllTokenCache
  window.logout = () => authAPI.logout()
  
  // Check token expiry function
  window.checkToken = () => {
    const token = getToken()
    if (!token) {
      console.log('❌ No token found in localStorage')
      return
    }
    
    try {
      // Decode token payload
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = new Date(payload.exp * 1000)
      const isExpired = now > payload.exp
      
      console.log('🔍 TOKEN ANALYSIS:')
      console.log('Token:', token.substring(0, 50) + '...')
      console.log('User:', payload.username)
      console.log('Role:', payload.role)
      console.log('Issued at:', new Date(payload.iat * 1000))
      console.log('Expires at:', expiresAt)
      console.log('Current time:', new Date())
      console.log('Is expired:', isExpired ? '❌ YES' : '✅ NO')
      
      if (isExpired) {
        console.log('⚠️ TOKEN IS EXPIRED! This is why you get 403 errors.')
      } else {
        console.log('✅ Token is still valid')
      }
      
      return { token, payload, isExpired, expiresAt }
    } catch (error) {
      console.log('❌ Invalid token format:', error.message)
    }
  }
  
  // Test token function
  window.testToken = async () => {
    const token = getToken()
    console.log('Current token:', token)
    
    try {
      const response = await fetch('http://localhost:30081/api/land-titles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        console.log('✅ Token is working!')
      } else {
        console.log('❌ Token failed:', data)
      }
    } catch (error) {
      console.log('❌ Test failed:', error)
    }
  }
}

// TOKEN VALIDATION HELPER
const isTokenValid = (token) => {
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    return now < payload.exp // Check if not expired
  } catch (error) {
    return false
  }
}

// DEVELOPMENT BYPASS - Remove in production
if (typeof window !== 'undefined') {
  // User switching functions for development
  window.loginAsAdmin = () => {
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6IkFETUlOIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6MjA3NjI0MTQ5NSwiaWF0IjoxNzYwODgxNDk1fQ.RL-5w6Cbxu2QZlWHX0hybtL7LEXCeBDUB6zvl33Q0y0'
    setToken(adminToken)
    console.log('👤 DEV: Logged in as ADMIN')
    window.location.reload()
  }
  
  window.loginAsProcessor = () => {
    const processorToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImpveWJveTYwMCIsImVtYWlsIjoiam95Ym95NjAwQGV4YW1wbGUuY29tIiwicm9sZSI6IkxBTkRfVElUTEVfUFJPQ0VTU09SIiwiaWF0IjoxNzYwOTI0NzMzLCJleHAiOjE3NjEwMTExMzN9.EvqMcXrgQpJul-HiBywo4Wvikd-AwCMOScQA9pLB7YA'
    setToken(processorToken)
    console.log('👤 DEV: Logged in as LAND_TITLE_PROCESSOR (joyboy600)')
    window.location.reload()
  }
  
  // Legacy bypass function
  window.bypassAuth = window.loginAsAdmin
  
  // Add console helper functions
  console.log('🔧 AVAILABLE FUNCTIONS:')
  console.log('- checkToken() - Check if token is expired')
  console.log('- testToken() - Test token with API call')
  console.log('- clearTokenCache() - Clear all cached tokens')
  console.log('- bypassAuth() - DEV ONLY: Set temporary token')
  console.log('🔐 Login at /login or use bypassAuth() for dev')
}

// Refresh token function
const refreshToken = async () => {
  const currentToken = getToken()
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    }
  })
  
  if (!response.ok) throw new Error('Token refresh failed')
  
  const data = await response.json()
  return data.accessToken
}

// SIMPLIFIED REQUEST INTERCEPTOR - No Auto Logout
api.interceptors.request.use(
  (config) => {
    // Skip token validation for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register')
    
    if (isAuthEndpoint) {
      console.log('🔐 Auth endpoint - skipping token validation')
      return config
    }
    
    const token = getToken()
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('📤 Request with token:', token.substring(0, 50) + '...')
    } else {
      console.log('⚠️ No token found')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Function to generate fresh token automatically
const generateFreshToken = async () => {
  const currentToken = getToken()
  if (!currentToken) throw new Error('No current token')
  
  try {
    const currentPayload = JSON.parse(atob(currentToken.split('.')[1]))
    const response = await fetch('http://localhost:30081/api/auth/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentPayload.user_id,
        username: currentPayload.username,
        email: currentPayload.email,
        role: currentPayload.role
      })
    })
    
    if (!response.ok) throw new Error('Token generation failed')
    const data = await response.json()
    return data.token
  } catch (error) {
    throw new Error('Failed to preserve user role: ' + error.message)
  }
}

// Enhanced response interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      console.log('🔄 Token expired, attempting refresh...')
      originalRequest._retry = true
      
      try {
        // Generate new token automatically
        const newToken = await generateFreshToken()
        setToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        console.log('✅ Token refreshed successfully')
        return api(originalRequest)
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        console.log('⚠️ Please login again')
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

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          // Store fresh token from login
          setToken(data.token)
          console.log('✅ Login successful - token stored')
          console.log('👤 User:', data.user?.username)
          console.log('🔑 Role:', data.user?.role || 'Not specified')
        }
        return { ok: true, data }
      }
      
      const errorData = await response.json()
      console.log('❌ Login failed:', errorData)
      return { ok: false, error: errorData }
    } catch (error) {
      console.log('❌ Login error:', error.message)
      return { ok: false, error: { message: error.message } }
    }
  },
  
  logout: () => {
    clearAllTokenCache()
    console.log('🚪 Logged out successfully')
    window.location.href = '/login'
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