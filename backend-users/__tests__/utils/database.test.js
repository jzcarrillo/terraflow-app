jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { executeQuery, findById, findByField } = require('../../utils/database');
const { pool } = require('../../config/db');

describe('utils/database', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('executeQuery', () => {
    it('should execute query and return result', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      pool.query.mockResolvedValue(mockResult);

      const result = await executeQuery('SELECT * FROM users', []);
      expect(result).toEqual(mockResult);
    });

    it('should throw on query failure', async () => {
      pool.query.mockRejectedValue(new Error('Query failed'));
      await expect(executeQuery('BAD SQL')).rejects.toThrow('Query failed');
    });
  });

  describe('findById', () => {
    it('should return row when found', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, username: 'test' }] });
      const result = await findById('users', 1);
      expect(result).toEqual({ id: 1, username: 'test' });
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('should return null when not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await findById('users', 999);
      expect(result).toBeNull();
    });
  });

  describe('findByField', () => {
    it('should return matching rows', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValue({ rows });
      const result = await findByField('users', 'role', 'ADMIN');
      expect(result).toEqual(rows);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE role = $1', ['ADMIN']);
    });
  });
});
