import { loadConfig, API_CONFIG, ROLES, STATUS_COLORS } from '../config'

describe('config', () => {
  beforeEach(() => {
    delete window.__RUNTIME_CONFIG__
    localStorage.clear()
    global.fetch = jest.fn()
  })

  describe('loadConfig', () => {
    it('should fetch and return config', async () => {
      global.fetch.mockResolvedValue({
        json: () => Promise.resolve({ apiUrl: 'http://test/api' })
      })
      const config = await loadConfig()
      expect(config.apiUrl).toBe('http://test/api')
    })

    it('should return cached config on second call', async () => {
      jest.resetModules()
      const { loadConfig: freshLoad } = await import('../config')
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ apiUrl: 'http://test/api' })
      })
      await freshLoad()
      const config2 = await freshLoad()
      expect(config2.apiUrl).toBe('http://test/api')
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should return fallback on fetch error', async () => {
      // Reset cached config by reimporting
      jest.resetModules()
      const { loadConfig: freshLoad } = await import('../config')
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      const config = await freshLoad()
      expect(config.apiUrl).toBeDefined()
      expect(config.environment).toBeDefined()
    })
  })

  describe('API_CONFIG.BASE_URL', () => {
    it('should return from window.__RUNTIME_CONFIG__', () => {
      window.__RUNTIME_CONFIG__ = { apiUrl: 'http://runtime/api' }
      expect(API_CONFIG.BASE_URL).toBe('http://runtime/api')
    })

    it('should return from localStorage cache', () => {
      localStorage.setItem('__APP_CONFIG__', JSON.stringify({ apiUrl: 'http://cached/api' }))
      expect(API_CONFIG.BASE_URL).toBe('http://cached/api')
    })

    it('should return default when no config', () => {
      expect(API_CONFIG.BASE_URL).toBeDefined()
    })
  })

  describe('API_CONFIG.DASHBOARD_URL', () => {
    it('should return from window.__RUNTIME_CONFIG__', () => {
      window.__RUNTIME_CONFIG__ = { dashboardUrl: 'http://runtime/dash' }
      expect(API_CONFIG.DASHBOARD_URL).toBe('http://runtime/dash')
    })

    it('should return from localStorage cache', () => {
      localStorage.setItem('__APP_CONFIG__', JSON.stringify({ dashboardUrl: 'http://cached/dash' }))
      expect(API_CONFIG.DASHBOARD_URL).toBe('http://cached/dash')
    })

    it('should return default when no config', () => {
      expect(API_CONFIG.DASHBOARD_URL).toBeDefined()
    })
  })

  describe('ROLES', () => {
    it('should export all roles', () => {
      expect(ROLES.ADMIN).toBe('ADMIN')
      expect(ROLES.CASHIER).toBe('CASHIER')
      expect(ROLES.LAND_TITLE_PROCESSOR).toBe('LAND_TITLE_PROCESSOR')
    })
  })

  describe('STATUS_COLORS', () => {
    it('should map statuses to colors', () => {
      expect(STATUS_COLORS.ACTIVE).toBe('success')
      expect(STATUS_COLORS.PENDING).toBe('warning')
      expect(STATUS_COLORS.CANCELLED).toBe('error')
      expect(STATUS_COLORS.RELEASED).toBe('success')
    })
  })
})
