const paymentsRoutes = require('../payments');

describe('Payments Routes', () => {
  it('should export router', () => {
    expect(paymentsRoutes).toBeDefined();
    expect(typeof paymentsRoutes).toBe('function');
  });
});
