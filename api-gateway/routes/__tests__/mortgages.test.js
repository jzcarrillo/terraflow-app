const mortgagesRoutes = require('../mortgages');

describe('Mortgages Routes', () => {
  it('should export router', () => {
    expect(mortgagesRoutes).toBeDefined();
    expect(typeof mortgagesRoutes).toBe('function');
  });
});
