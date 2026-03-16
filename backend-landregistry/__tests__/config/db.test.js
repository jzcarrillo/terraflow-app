let poolErrorHandler;
const mockClient = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
const mockPool = {
  query: jest.fn().mockResolvedValue({}),
  connect: jest.fn().mockResolvedValue(mockClient),
  on: jest.fn((event, handler) => {
    if (event === 'error') poolErrorHandler = handler;
  })
};

jest.mock('pg', () => ({ Pool: jest.fn(() => mockPool) }));
jest.mock('../../config/services', () => ({
  database: { host: 'localhost', port: 5432, name: 'testdb', user: 'user', password: 'pass' }
}));

const { pool, testConnection, initializeDatabase } = require('../../config/db');

describe('Database Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.connect.mockResolvedValue(mockClient);
    mockPool.query.mockResolvedValue({});
    mockClient.query.mockResolvedValue({});
  });

  it('should export pool', () => {
    expect(pool).toBeDefined();
  });

  it('should exit process on pool error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    poolErrorHandler(new Error('idle client error'));
    expect(exitSpy).toHaveBeenCalledWith(-1);
    exitSpy.mockRestore();
  });

  describe('testConnection', () => {
    it('should connect and release', async () => {
      await testConnection();
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle connection error', async () => {
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));
      await testConnection();
    });
  });

  describe('initializeDatabase', () => {
    it('should initialize tables successfully', async () => {
      await initializeDatabase(1);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      mockPool.connect.mockRejectedValueOnce(new Error('DB down'));
      mockPool.connect.mockResolvedValueOnce(mockClient);

      await initializeDatabase(2);
      expect(mockPool.connect).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should throw after all retries fail', async () => {
      mockPool.connect.mockRejectedValue(new Error('DB down'));
      await expect(initializeDatabase(1)).rejects.toThrow('DB down');
    });
  });
});
