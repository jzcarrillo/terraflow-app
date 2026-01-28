jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { executeQuery, findById, findByField } = require('../../utils/database');
const { pool } = require('../../config/db');

describe('Database Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      pool.query.mockResolvedValue(mockResult);

      const result = await executeQuery('SELECT * FROM documents WHERE id = $1', [1]);

      expect(result).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM documents WHERE id = $1', [1]);
    });

    it('should handle query errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(executeQuery('SELECT * FROM documents')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find record by id', async () => {
      const mockRecord = { id: 1, name: 'Document' };
      pool.query.mockResolvedValue({ rows: [mockRecord] });

      const result = await findById('documents', 1);

      expect(result).toEqual(mockRecord);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM documents WHERE id = $1', [1]);
    });

    it('should return null if record not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await findById('documents', 999);

      expect(result).toBeNull();
    });
  });

  describe('findByField', () => {
    it('should find records by field', async () => {
      const mockRecords = [{ id: 1, land_title_id: 5 }, { id: 2, land_title_id: 5 }];
      pool.query.mockResolvedValue({ rows: mockRecords });

      const result = await findByField('documents', 'land_title_id', 5);

      expect(result).toEqual(mockRecords);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM documents WHERE land_title_id = $1', [5]);
    });

    it('should return empty array if no records found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await findByField('documents', 'land_title_id', 999);

      expect(result).toEqual([]);
    });
  });
});
