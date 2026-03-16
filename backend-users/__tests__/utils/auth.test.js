jest.mock('../../config/services', () => ({
  jwt: { secret: 'test-secret' }
}));

const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../utils/auth');

describe('utils/auth', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 401 if no authorization header', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 on invalid token', () => {
    req.headers['authorization'] = 'Bearer bad-token';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next with valid token', () => {
    const token = jwt.sign({ id: 1 }, 'test-secret');
    req.headers['authorization'] = `Bearer ${token}`;
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });
});
