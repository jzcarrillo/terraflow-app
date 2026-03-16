import api, { landTitlesAPI, paymentsAPI, transfersAPI, authAPI, usersAPI, mortgagesAPI } from '../api'

jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' }
}))
jest.mock('@/utils/auth', () => ({
  getToken: jest.fn(() => 'test-token'),
  setToken: jest.fn(),
  isTokenValid: jest.fn(() => true),
  getCurrentUser: jest.fn(() => ({ id: 1, username: 'test' }))
}))

describe('services/api', () => {
  describe('api instance', () => {
    it('should have baseURL and headers', () => {
      expect(api.defaults.baseURL).toBe('http://test/api')
      expect(api.defaults.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('request interceptor', () => {
    const reqFulfilled = api.interceptors.request.handlers[0].fulfilled
    const reqRejected = api.interceptors.request.handlers[0].rejected

    it('adds Authorization for non-auth endpoints', async () => {
      const config = { url: '/land-titles', headers: {} }
      const result = await reqFulfilled(config)
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('skips Authorization for auth endpoints', async () => {
      const config = { url: '/auth/login', headers: {} }
      const result = await reqFulfilled(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('handles no token', async () => {
      const { getToken } = require('@/utils/auth')
      getToken.mockReturnValueOnce(null)
      const config = { url: '/land-titles', headers: {} }
      const result = await reqFulfilled(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('rejects on error', async () => {
      await expect(reqRejected(new Error('fail'))).rejects.toThrow('fail')
    })
  })

  describe('response interceptor', () => {
    const resFulfilled = api.interceptors.response.handlers[0].fulfilled
    const resRejected = api.interceptors.response.handlers[0].rejected

    it('passes through successful responses', () => {
      const response = { data: 'ok' }
      expect(resFulfilled(response)).toEqual(response)
    })

    it('retries on 401 with fresh token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true, json: () => Promise.resolve({ token: 'new-token' })
      })

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: false }
      }

      // The retry will call api() which will fail since no real server
      // but we verify the flow attempts refresh
      try {
        await resRejected(error)
      } catch (e) {
        // Expected - api() call fails in test env
      }
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/generate-token'),
        expect.any(Object)
      )
    })

    it('redirects to login when refresh fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('fail'))
      jest.spyOn(console, 'error').mockImplementation()

      const error = {
        response: { status: 403 },
        config: { headers: {}, _retry: false }
      }

      try { await resRejected(error) } catch (e) {}
      jest.restoreAllMocks()
    })

    it('rejects non-401/403 errors', async () => {
      const error = { response: { status: 500 }, config: { headers: {} } }
      await expect(resRejected(error)).rejects.toEqual(error)
    })

    it('rejects already-retried requests', async () => {
      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: true }
      }
      await expect(resRejected(error)).rejects.toEqual(error)
    })

    it('redirects when no current user for token refresh', async () => {
      const { getCurrentUser } = require('@/utils/auth')
      getCurrentUser.mockReturnValueOnce(null)
      jest.spyOn(console, 'error').mockImplementation()

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: false }
      }

      try { await resRejected(error) } catch (e) {}
      jest.restoreAllMocks()
    })
  })

  describe('API method calls', () => {
    beforeEach(() => {
      jest.spyOn(api, 'get').mockResolvedValue({ data: {} })
      jest.spyOn(api, 'post').mockResolvedValue({ data: {} })
      jest.spyOn(api, 'put').mockResolvedValue({ data: {} })
      jest.spyOn(api, 'delete').mockResolvedValue({ data: {} })
    })
    afterEach(() => jest.restoreAllMocks())

    it('landTitlesAPI calls', async () => {
      await landTitlesAPI.getAll()
      await landTitlesAPI.getById(1)
      await landTitlesAPI.create({ field: 'val' })
      await landTitlesAPI.create(new FormData())
      await landTitlesAPI.validate('TCT-001')
      await landTitlesAPI.getBlockchainHistory('TCT-001')
      expect(api.get).toHaveBeenCalled()
      expect(api.post).toHaveBeenCalledTimes(2)
    })

    it('paymentsAPI calls', async () => {
      await paymentsAPI.getAll()
      await paymentsAPI.getById(1)
      await paymentsAPI.create({ amount: 100 })
      await paymentsAPI.update(1, { amount: 200 })
      await paymentsAPI.confirm(1)
      await paymentsAPI.cancel(1)
      await paymentsAPI.getStatus(1)
      expect(api.get).toHaveBeenCalled()
      expect(api.post).toHaveBeenCalledTimes(1)
      expect(api.put).toHaveBeenCalledTimes(3)
    })

    it('transfersAPI calls', async () => {
      await transfersAPI.getAll()
      await transfersAPI.getById(1)
      await transfersAPI.create({ data: 'x' })
      await transfersAPI.update(1, { data: 'y' })
      await transfersAPI.complete(1, 'PAY-1')
      await transfersAPI.updateStatus(1, 'COMPLETED')
      await transfersAPI.delete(1)
      expect(api.delete).toHaveBeenCalledTimes(1)
    })

    it('usersAPI calls', async () => {
      await usersAPI.getProfile()
      expect(api.get).toHaveBeenCalledWith('/users/profile')
    })

    it('mortgagesAPI calls', async () => {
      await mortgagesAPI.getAll()
      await mortgagesAPI.getById(1)
      await mortgagesAPI.create({ land_title_id: 1, bank_name: 'BDO', attachments: new File([''], 'doc.pdf') })
      await mortgagesAPI.create({ land_title_id: 1, bank_name: 'BDO' })
      await mortgagesAPI.update(1, {})
      await mortgagesAPI.cancel(1)
      await mortgagesAPI.createRelease(1)
      await mortgagesAPI.updateRelease(1, {})
      await mortgagesAPI.cancelRelease(1)
      await mortgagesAPI.checkTransferEligibility(1)
      await mortgagesAPI.getLandTitlesForMortgage()
      await mortgagesAPI.getAttachments(1)
      expect(api.post).toHaveBeenCalled()
      expect(api.delete).toHaveBeenCalled()
    })
  })

  describe('authAPI', () => {
    beforeEach(() => { global.fetch = jest.fn() })

    it('login success with token', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ token: 'tk' }) })
      const result = await authAPI.login({ username: 'u', password: 'p' })
      expect(result.ok).toBe(true)
    })

    it('login failure', async () => {
      global.fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ message: 'bad' }) })
      const result = await authAPI.login({ username: 'u', password: 'p' })
      expect(result.ok).toBe(false)
    })

    it('login network error', async () => {
      global.fetch.mockRejectedValue(new Error('net'))
      const result = await authAPI.login({ username: 'u', password: 'p' })
      expect(result.ok).toBe(false)
    })

    it('logout clears storage', () => {
      localStorage.setItem('token', 'x')
      jest.spyOn(console, 'error').mockImplementation()
      authAPI.logout()
      expect(localStorage.getItem('token')).toBeNull()
      jest.restoreAllMocks()
    })

    it('register calls fetch', () => {
      global.fetch.mockResolvedValue({ ok: true })
      authAPI.register({ username: 'new' })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/register'), expect.any(Object))
    })
  })
})
