jest.mock('../../controllers/transfers');
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Transfers Routes', () => {
  it('should export router with all required routes', () => {
    const router = require('../../routes/transfers');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/', method: 'post' });
    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/:id/status', method: 'put' });
    expect(routes).toContainEqual({ path: '/:id', method: 'put' });
    expect(routes).toContainEqual({ path: '/:id', method: 'delete' });
  });
});
