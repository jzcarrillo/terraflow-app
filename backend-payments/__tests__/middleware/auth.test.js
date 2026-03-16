jest.mock('../../utils/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

const { authenticateToken } = require('../../middleware/auth');

describe('Auth Middleware', () => {
  it('should re-export authenticateToken from utils/auth', () => {
    expect(authenticateToken).toBeDefined();
    expect(typeof authenticateToken).toBe('function');
  });
});
