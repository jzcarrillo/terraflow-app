const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../utils/auth');

describe('Auth Middleware', () => {
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

  it('should return 403 if token is invalid', () => {
    req.headers['authorization'] = 'Bearer invalid-token';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('should call next with valid token', () => {
    const token = jwt.sign({ id: 1, username: 'test' }, process.env.JWT_SECRET || 'your-secret-key');
    req.headers['authorization'] = `Bearer ${token}`;
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
  });
});
