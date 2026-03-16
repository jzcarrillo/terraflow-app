jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn().mockResolvedValue({}),
    release: jest.fn()
  };
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient)
  };
  return { Pool: jest.fn(() => mockPool) };
});

const { pool, initializeDatabase } = require('../../config/db');

describe('Database Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export pool', () => {
    expect(pool).toBeDefined();
    expect(pool.connect).toBeDefined();
  });

  it('should initialize database successfully', async () => {
    const mockClient = await pool.connect();
    await initializeDatabase();

    expect(pool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should throw on initialization failure', async () => {
    pool.connect.mockRejectedValueOnce(new Error('Connection failed'));

    await expect(initializeDatabase()).rejects.toThrow('Connection failed');
  });
});
