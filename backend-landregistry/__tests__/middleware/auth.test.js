const { authenticateToken } = require('../../middleware/auth');

describe('Auth Middleware', () => {
  it('should export authenticateToken from utils/auth', () => {
    expect(authenticateToken).toBeDefined();
    expect(typeof authenticateToken).toBe('function');
  });
});
