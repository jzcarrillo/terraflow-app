jest.mock('../../config/services', () => ({
  jwt: { secret: 'test-secret' }
}));

const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');

describe('middleware/auth', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 401 if no token provided', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
  });

  it('should return 401 if authorization header has no Bearer token', () => {
    req.headers['authorization'] = '';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 if token is invalid', () => {
    req.headers['authorization'] = 'Bearer invalid-token';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('should set req.user and call next on valid token', () => {
    const payload = { id: 1, username: 'testuser' };
    const token = jwt.sign(payload, 'test-secret');
    req.headers['authorization'] = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
});
