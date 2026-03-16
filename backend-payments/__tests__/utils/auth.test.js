const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../utils/auth');

describe('Auth Utils', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 401 if no token', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 if token is invalid', () => {
    req.headers['authorization'] = 'Bearer bad-token';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next with valid token', () => {
    const config = require('../../config/services');
    const token = jwt.sign({ id: 1 }, config.jwt.secret);
    req.headers['authorization'] = `Bearer ${token}`;
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });
});
