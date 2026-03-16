jest.mock('../../controllers/mortgages');
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Mortgages Routes', () => {
  it('should export router with all required routes', () => {
    const router = require('../../routes/mortgages');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/available-titles', method: 'get' });
    expect(routes).toContainEqual({ path: '/for-payment', method: 'get' });
    expect(routes).toContainEqual({ path: '/check-transfer/:id', method: 'get' });
    expect(routes).toContainEqual({ path: '/validate/:id', method: 'get' });
    expect(routes).toContainEqual({ path: '/:id', method: 'get' });
    expect(routes).toContainEqual({ path: '/:id', method: 'put' });
    expect(routes).toContainEqual({ path: '/:id', method: 'delete' });
    expect(routes).toContainEqual({ path: '/:id/release', method: 'post' });
  });
});
