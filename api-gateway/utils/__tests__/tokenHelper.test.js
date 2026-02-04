const { extractToken, verifyToken, generateToken } = require('../tokenHelper');

describe('Token Helper', () => {
  describe('extractToken', () => {
    it('extracts token from Bearer header', () => {
      const req = {
        headers: { authorization: 'Bearer test-token-123' }
      };
      expect(extractToken(req)).toBe('test-token-123');
    });

    it('returns null if no authorization header', () => {
      const req = { headers: {} };
      expect(extractToken(req)).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('generates valid JWT token', () => {
      const payload = { userId: 1, role: 'admin' };
      const token = generateToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('verifies valid token', () => {
      const payload = { userId: 1, role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(1);
      expect(decoded.role).toBe('admin');
    });

    it('throws error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('throws error for null token', () => {
      expect(() => verifyToken(null)).toThrow('Access token required');
    });
  });
});
