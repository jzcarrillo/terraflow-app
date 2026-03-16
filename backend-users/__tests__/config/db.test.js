jest.useFakeTimers();

const mockClient = { release: jest.fn() };
const mockPool = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

let db;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('config/db', () => {
  describe('initializeDatabase', () => {
    it('should connect and create table on success', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockPool.query.mockResolvedValue({});

      db = require('../../config/db');
      const result = await db.initializeDatabase();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS'));
      expect(result).toBeUndefined();
    });

    it('should retry on failure and succeed', async () => {
      mockPool.connect
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce(mockClient);
      mockPool.query.mockResolvedValue({});

      db = require('../../config/db');
      const promise = db.initializeDatabase(2);

      await jest.advanceTimersByTimeAsync(5000);
      await promise;

      expect(mockPool.connect).toHaveBeenCalledTimes(2);
    });

    it('should log error after all retries exhausted', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection refused'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      db = require('../../config/db');
      const promise = db.initializeDatabase(2);

      await jest.advanceTimersByTimeAsync(5000);
      await promise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database initialization failed'),
        'Connection refused'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('testConnection', () => {
    it('should log success on connection', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      db = require('../../config/db');
      await db.testConnection();

      expect(consoleSpy).toHaveBeenCalledWith('✅ Database connected');
      expect(mockClient.release).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error on connection failure', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      db = require('../../config/db');
      await db.testConnection();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Database connection failed:', 'Connection failed');
      consoleSpy.mockRestore();
    });
  });

  it('should export pool', () => {
    db = require('../../config/db');
    expect(db.pool).toBeDefined();
  });

  it('should trigger setTimeout on module load', async () => {
    mockPool.connect.mockResolvedValue(mockClient);
    mockPool.query.mockResolvedValue({});

    db = require('../../config/db');

    await jest.advanceTimersByTimeAsync(10000);

    // setTimeout fires initializeDatabase which calls pool.connect
    expect(mockPool.connect).toHaveBeenCalled();
  });
});
