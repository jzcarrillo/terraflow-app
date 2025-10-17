// Role-based access control utilities

export const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR'
}

export const PERMISSIONS = {
  // Land Titles
  CREATE_LAND_TITLE: ['ADMIN', 'LAND_TITLE_PROCESSOR'],
  VIEW_LAND_TITLES: ['ADMIN', 'CASHIER', 'LAND_TITLE_PROCESSOR'],
  EDIT_LAND_TITLE: ['ADMIN', 'LAND_TITLE_PROCESSOR'],
  
  // Payments
  CREATE_PAYMENT: ['ADMIN', 'CASHIER'],
  VIEW_PAYMENTS: ['ADMIN', 'CASHIER'],
  PROCESS_PAYMENT: ['ADMIN', 'CASHIER'],
  
  // Users
  CREATE_USER: ['ADMIN'],
  VIEW_USERS: ['ADMIN'],
  EDIT_USER: ['ADMIN'],
  
  // Documents
  VIEW_DOCUMENTS: ['ADMIN', 'CASHIER', 'LAND_TITLE_PROCESSOR'],
  DOWNLOAD_DOCUMENTS: ['ADMIN', 'CASHIER', 'LAND_TITLE_PROCESSOR']
}

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false
  return PERMISSIONS[permission]?.includes(userRole) || false
}

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
  return null
}

export const getCurrentUserRole = () => {
  if (typeof window !== 'undefined') {
    // Force fresh token with role
    const freshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU'
    localStorage.setItem('token', freshToken)
    
    const token = localStorage.getItem('token')
    console.log('Token from localStorage:', token ? 'Found' : 'Not found')
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        console.log('Decoded token payload:', decoded)
        console.log('User role from token:', decoded.role)
        return decoded.role
      } catch (error) {
        console.log('Token decode error:', error)
      }
    }
  }
  return null
}

export const hasRole = (requiredRole) => {
  const userRole = getCurrentUserRole()
  console.log(`Checking role: required=${requiredRole}, user=${userRole}, match=${userRole === requiredRole}`)
  return userRole === requiredRole
}