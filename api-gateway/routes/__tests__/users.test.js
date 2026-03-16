const usersRoutes = require('../users');

describe('Users Routes', () => {
  it('should export router', () => {
    expect(usersRoutes).toBeDefined();
    expect(typeof usersRoutes).toBe('function');
  });
});
