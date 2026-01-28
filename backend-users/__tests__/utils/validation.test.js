jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() }
}));
jest.mock('../../config/constants', () => ({
  TABLES: { USERS: 'users' }
}));

const { checkEmailExists, checkUsernameExists, validateWithSchema } = require('../../utils/validation');
const { pool } = require('../../config/db');

describe('User Validation Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const result = await checkEmailExists('test@example.com');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM users WHERE email_address = $1',
        ['test@example.com']
      );
    });

    it('should return false if email does not exist', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await checkEmailExists('new@example.com');

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(checkEmailExists('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('checkUsernameExists', () => {
    it('should return true if username exists', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const result = await checkUsernameExists('testuser');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM users WHERE username = $1',
        ['testuser']
      );
    });

    it('should return false if username does not exist', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await checkUsernameExists('newuser');

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(checkUsernameExists('testuser')).rejects.toThrow('Database error');
    });
  });

  describe('validateWithSchema', () => {
    it('should return parsed data on valid schema', () => {
      const mockSchema = { parse: jest.fn((data) => data) };
      const data = { username: 'test' };

      const result = validateWithSchema(mockSchema, data);

      expect(result).toEqual(data);
      expect(mockSchema.parse).toHaveBeenCalledWith(data);
    });

    it('should throw error on invalid schema', () => {
      const mockSchema = { parse: jest.fn(() => { throw new Error('Invalid data'); }) };
      const data = { username: '' };

      expect(() => validateWithSchema(mockSchema, data)).toThrow('Invalid data');
    });
  });
});
