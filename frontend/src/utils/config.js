// Runtime config - will be loaded from API endpoint
let runtimeConfig = null;

export async function loadConfig() {
  if (runtimeConfig) return runtimeConfig;
  
  try {
    const response = await fetch('/api/config');
    runtimeConfig = await response.json();
    return runtimeConfig;
  } catch (error) {
    console.error('Failed to load runtime config:', error);
    // Fallback to defaults
    return {
      apiUrl: 'http://localhost:30081/api',
      dashboardUrl: 'http://localhost:4005/',
      environment: 'development'
    };
  }
}

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