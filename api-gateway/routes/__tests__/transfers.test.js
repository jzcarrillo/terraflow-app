const transfersRoutes = require('../transfers');

describe('Transfers Routes', () => {
  it('should export router', () => {
    expect(transfersRoutes).toBeDefined();
    expect(typeof transfersRoutes).toBe('function');
  });
});
