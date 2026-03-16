jest.mock('../../controllers/blockchain');
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Blockchain Routes', () => {
  it('should export router', () => {
    const router = require('../../routes/blockchain');
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
  });

  it('should have GET /query/:titleNumber route', () => {
    const router = require('../../routes/blockchain');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/query/:titleNumber', method: 'get' });
  });

  it('should have GET /history/:titleNumber route', () => {
    const router = require('../../routes/blockchain');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/history/:titleNumber', method: 'get' });
  });

  it('should have POST /verify route', () => {
    const router = require('../../routes/blockchain');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/verify', method: 'post' });
  });
});
