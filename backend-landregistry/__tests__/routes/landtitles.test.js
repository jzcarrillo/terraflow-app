jest.mock('../../controllers/landtitles');
jest.mock('../../controllers/mortgages');
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Land Titles Routes', () => {
  it('should export router', () => {
    const router = require('../../routes/landtitles');
    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();
  });

  it('should have all required routes', () => {
    const router = require('../../routes/landtitles');
    const routes = router.stack.filter(r => r.route).map(r => ({ path: r.route.path, method: Object.keys(r.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/validate/land-title-exists', method: 'get' });
    expect(routes).toContainEqual({ path: '/validate/:titleNumber', method: 'get' });
    expect(routes).toContainEqual({ path: '/:id', method: 'get' });
    expect(routes).toContainEqual({ path: '/:id/mortgage', method: 'post' });
    expect(routes).toContainEqual({ path: '/:id/mortgages', method: 'get' });
  });
});
