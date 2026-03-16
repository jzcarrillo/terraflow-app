const { requireRole } = require('../roleAuth');
const { generateToken } = require('../../utils/tokenHelper');

describe('Role Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should allow user with correct role', () => {
    const token = generateToken({ user_id: 1, username: 'admin', role: 'admin' });
    req.headers.authorization = `Bearer ${token}`;
    
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it('should reject user with wrong role', () => {
    const token = generateToken({ user_id: 1, username: 'user', role: 'user' });
    req.headers.authorization = `Bearer ${token}`;
    
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should reject missing token', () => {
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should reject invalid token', () => {
    req.headers.authorization = 'Bearer invalid';
    
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
