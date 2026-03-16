jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { executeQuery, findById, findByField, updateById } = require('../../utils/database');
const { pool } = require('../../config/db');

describe('Database Utils', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      const result = await executeQuery('SELECT 1', []);
      expect(result.rows).toEqual([{ id: 1 }]);
    });

    it('should throw on query error', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      await expect(executeQuery('BAD SQL')).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should find record by id', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'test' }] });
      const result = await findById('payments', 1);
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should return null if not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await findById('payments', 999);
      expect(result).toBeNull();
    });
  });

  describe('findByField', () => {
    it('should find records by field', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
      const result = await findByField('payments', 'status', 'PAID');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if none found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await findByField('payments', 'status', 'UNKNOWN');
      expect(result).toEqual([]);
    });
  });

  describe('updateById', () => {
    it('should update record and return it', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, amount: 6000 }] });
      const result = await updateById('payments', 1, { amount: 6000 });
      expect(result.amount).toBe(6000);
    });

    it('should return null if record not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await updateById('payments', 999, { amount: 6000 });
      expect(result).toBeNull();
    });
  });
});
