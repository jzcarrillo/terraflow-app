const { authenticateToken, requireRole, refreshToken, generateTokenEndpoint } = require('../auth');
const { generateToken } = require('../../utils/tokenHelper');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = generateToken({ user_id: 1, username: 'test', role: 'user' });
      req.headers.authorization = `Bearer ${token}`;
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing token', () => {
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRole', () => {
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
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Access denied' }));
    });

    it('should reject missing token', () => {
      const middleware = requireRole(['admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      req.user = { user_id: 1, username: 'test', email: 'test@test.com', role: 'user' };
      
      refreshToken(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
    });

    it('should handle refresh error', () => {
      req.user = null;
      
      refreshToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateTokenEndpoint', () => {
    it('should generate token successfully', () => {
      req.body = { user_id: 1, username: 'test', email: 'test@test.com', role: 'user' };
      
      generateTokenEndpoint(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
    });
  });
});
