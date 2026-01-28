jest.mock('../../config/db');

const { checkTitleExists, validateWithSchema } = require('../../utils/validation');
const { pool } = require('../../config/db');

describe('Validation Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkTitleExists', () => {
    it('should return true if title exists', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await checkTitleExists('TCT-001');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM land_titles WHERE title_number = $1',
        ['TCT-001']
      );
    });

    it('should return false if title does not exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await checkTitleExists('TCT-999');

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(checkTitleExists('TCT-001')).rejects.toThrow('Database error');
    });
  });

  describe('validateWithSchema', () => {
    it('should return parsed data on valid schema', () => {
      const mockSchema = { parse: jest.fn((data) => data) };
      const data = { name: 'Test' };

      const result = validateWithSchema(mockSchema, data);

      expect(result).toEqual(data);
      expect(mockSchema.parse).toHaveBeenCalledWith(data);
    });

    it('should throw error on invalid schema', () => {
      const mockSchema = { parse: jest.fn(() => { throw new Error('Invalid data'); }) };
      const data = { name: '' };

      expect(() => validateWithSchema(mockSchema, data)).toThrow('Invalid data');
    });
  });
});
