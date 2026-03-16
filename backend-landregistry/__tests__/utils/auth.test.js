jest.mock('jsonwebtoken');
jest.mock('../../config/services', () => ({ jwt: { secret: 'test-secret' } }));

const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../utils/auth');

describe('Auth Utility', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no token', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('Invalid'), null));

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: 1, username: 'test' }));

    authenticateToken(req, res, next);
    expect(req.user).toEqual({ id: 1, username: 'test' });
    expect(next).toHaveBeenCalled();
  });
});
