import { API_CONFIG } from './config'

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const setToken = (token) => typeof window !== 'undefined' && localStorage.setItem('token', token)

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const decodeToken = (token) => {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (error) {
    return null
  }
}

export const getCurrentUser = () => {
  const token = getToken()
  return decodeToken(token)
}

export const isTokenValid = (token) => {
  if (!token) return false
  try {
    const payload = decodeToken(token)
    const now = Math.floor(Date.now() / 1000)
    return now < payload.exp
  } catch (error) {
    return false
  }
}

export const hasRole = (requiredRole) => {
  const user = getCurrentUser()
  return user?.role === requiredRole
}

export const logout = () => {
  clearToken()
  window.location.href = '/login'
}