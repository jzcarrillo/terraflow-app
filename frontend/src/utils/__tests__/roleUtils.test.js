import { ROLES, PERMISSIONS, hasPermission, getCurrentUser, hasRole, getCurrentUserRole } from '../roleUtils'

jest.mock('@/utils/auth', () => ({
  getCurrentUser: jest.fn(() => ({ role: 'ADMIN' })),
  hasRole: jest.fn((role) => role === 'ADMIN')
}))

describe('roleUtils', () => {
  it('should export ROLES', () => {
    expect(ROLES.ADMIN).toBe('ADMIN')
  })

  it('should export PERMISSIONS', () => {
    expect(PERMISSIONS.CREATE_LAND_TITLE).toContain('ADMIN')
    expect(PERMISSIONS.CREATE_PAYMENT).toContain('CASHIER')
    expect(PERMISSIONS.CREATE_USER).toEqual(['ADMIN'])
  })

  describe('hasPermission', () => {
    it('returns true for valid role/permission', () => {
      expect(hasPermission('ADMIN', 'CREATE_LAND_TITLE')).toBe(true)
    })

    it('returns false for invalid role', () => {
      expect(hasPermission('CASHIER', 'CREATE_USER')).toBe(false)
    })

    it('returns false for null role', () => {
      expect(hasPermission(null, 'CREATE_USER')).toBe(false)
    })

    it('returns false for null permission', () => {
      expect(hasPermission('ADMIN', null)).toBe(false)
    })

    it('returns false for unknown permission', () => {
      expect(hasPermission('ADMIN', 'UNKNOWN')).toBe(false)
    })
  })

  it('should export getCurrentUser', () => {
    expect(getCurrentUser()).toEqual({ role: 'ADMIN' })
  })

  it('should export hasRole', () => {
    expect(hasRole('ADMIN')).toBe(true)
  })

  it('should export getCurrentUserRole', () => {
    expect(getCurrentUserRole()).toBe('ADMIN')
  })
})
