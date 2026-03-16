const authRoutes = require('../auth');

describe('Auth Routes', () => {
  it('should export router', () => {
    expect(authRoutes).toBeDefined();
    expect(typeof authRoutes).toBe('function');
  });
});
