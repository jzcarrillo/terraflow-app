const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

jest.mock('../../config/db', () => ({
  pool: { connect: jest.fn().mockResolvedValue(mockClient) }
}));

const transactionManager = require('../../services/transaction-manager');

describe('Transaction Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockResolvedValue({});
  });

  describe('executeWithTransaction', () => {
    it('should throw if pool is not initialized', async () => {
      const { pool } = require('../../config/db');
      const originalConnect = pool.connect;
      delete pool.connect;

      await expect(transactionManager.executeWithTransaction([jest.fn()])).rejects.toThrow('Database pool not properly initialized');

      pool.connect = originalConnect;
    });

    it('should execute operations and commit', async () => {
      const op1 = jest.fn().mockResolvedValue('result1');
      const op2 = jest.fn().mockResolvedValue('result2');

      const results = await transactionManager.executeWithTransaction([op1, op2]);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(results).toEqual(['result1', 'result2']);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const op1 = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(transactionManager.executeWithTransaction([op1])).rejects.toThrow('DB error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('executeWithSaga', () => {
    it('should execute all steps', async () => {
      const step1 = { execute: jest.fn().mockResolvedValue(true), compensate: jest.fn() };
      const step2 = { execute: jest.fn().mockResolvedValue(true) };

      await transactionManager.executeWithSaga([step1, step2]);
      expect(step1.execute).toHaveBeenCalled();
      expect(step2.execute).toHaveBeenCalled();
    });

    it('should run compensations on failure', async () => {
      const comp1 = jest.fn().mockResolvedValue(true);
      const step1 = { execute: jest.fn().mockResolvedValue(true), compensate: comp1 };
      const step2 = { execute: jest.fn().mockRejectedValue(new Error('Step failed')) };

      await expect(transactionManager.executeWithSaga([step1, step2])).rejects.toThrow('Step failed');
      expect(comp1).toHaveBeenCalled();
    });

    it('should handle compensation failure gracefully', async () => {
      const comp1 = jest.fn().mockRejectedValue(new Error('Comp failed'));
      const step1 = { execute: jest.fn().mockResolvedValue(true), compensate: comp1 };
      const step2 = { execute: jest.fn().mockRejectedValue(new Error('Step failed')) };

      await expect(transactionManager.executeWithSaga([step1, step2])).rejects.toThrow('Step failed');
      expect(comp1).toHaveBeenCalled();
    });
  });
});
