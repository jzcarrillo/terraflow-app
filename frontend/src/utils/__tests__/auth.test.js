import { decodeToken, isTokenValid, hasRole, getToken, setToken, clearToken, getCurrentUser } from '../auth'

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getToken', () => {
    it('gets token from localStorage', () => {
      localStorage.setItem('token', 'test-token')
      expect(getToken()).toBe('test-token')
    })

    it('returns null if no token', () => {
      expect(getToken()).toBeNull()
    })
  })

  describe('setToken', () => {
    it('sets token in localStorage', () => {
      setToken('new-token')
      expect(localStorage.getItem('token')).toBe('new-token')
    })
  })

  describe('clearToken', () => {
    it('removes token and user from localStorage', () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', 'test-user')
      clearToken()
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('decodeToken', () => {
    it('decodes valid JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.test'
      const decoded = decodeToken(token)
      expect(decoded).toHaveProperty('userId')
      expect(decoded).toHaveProperty('role')
    })

    it('returns null for invalid token', () => {
      expect(decodeToken('invalid')).toBeNull()
      expect(decodeToken(null)).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('returns decoded user from token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.test'
      localStorage.setItem('token', token)
      const user = getCurrentUser()
      expect(user).toHaveProperty('userId', 1)
    })

    it('returns null if no token', () => {
      expect(getCurrentUser()).toBeNull()
    })
  })

  describe('isTokenValid', () => {
    it('returns true for valid token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test'
      expect(isTokenValid(token)).toBe(true)
    })

    it('returns false for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.test'
      expect(isTokenValid(expiredToken)).toBe(false)
    })

    it('returns false for null token', () => {
      expect(isTokenValid(null)).toBe(false)
    })

    it('returns false for invalid token', () => {
      expect(isTokenValid('invalid')).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('checks user role correctly', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.test'
      localStorage.setItem('token', token)
      expect(hasRole('admin')).toBe(true)
      expect(hasRole('user')).toBe(false)
    })

    it('returns false if no token', () => {
      expect(hasRole('admin')).toBe(false)
    })
  })
})
