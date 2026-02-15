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
    // Fallback to environment or defaults
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081/api',
      dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:4005/',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

export const API_CONFIG = {
  get BASE_URL() {
    if (typeof window !== 'undefined') {
      // Check window first
      if (window.__RUNTIME_CONFIG__) {
        return window.__RUNTIME_CONFIG__.apiUrl;
      }
      // Fallback to localStorage
      const cached = localStorage.getItem('__APP_CONFIG__');
      if (cached) {
        const config = JSON.parse(cached);
        window.__RUNTIME_CONFIG__ = config; // Restore to window
        return config.apiUrl;
      }
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30091/api';
  },
  get DASHBOARD_URL() {
    if (typeof window !== 'undefined') {
      // Check window first
      if (window.__RUNTIME_CONFIG__) {
        return window.__RUNTIME_CONFIG__.dashboardUrl;
      }
      // Fallback to localStorage
      const cached = localStorage.getItem('__APP_CONFIG__');
      if (cached) {
        const config = JSON.parse(cached);
        window.__RUNTIME_CONFIG__ = config; // Restore to window
        return config.dashboardUrl;
      }
    }
    return process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:30081/';
  }
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