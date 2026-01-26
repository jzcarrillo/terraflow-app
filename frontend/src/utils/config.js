export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081/api',
  DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:4005/'
}

export const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR'
}

export const STATUS_COLORS = {
  ACTIVE: 'success',
  PENDING: 'warning',
  COMPLETED: 'success',
  PAID: 'success',
  CANCELLED: 'error',
  FAILED: 'error'
}