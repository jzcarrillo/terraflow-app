let connectCallback;
let mockPoolQuery;

jest.mock('pg', () => {
  mockPoolQuery = jest.fn().mockResolvedValue({});
  const mockPool = {
    query: mockPoolQuery,
    connect: jest.fn((cb) => { connectCallback = cb; })
  };
  return { Pool: jest.fn(() => mockPool) };
});

jest.mock('../../config/services', () => ({
  database: { host: 'localhost', port: 5435, name: 'testdb', user: 'user', password: 'pass' }
}));

describe('Database Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export pool', () => {
    const { pool } = require('../../config/db');
    expect(pool).toBeDefined();
  });

  it('should handle successful connection and create tables', async () => {
    require('../../config/db');
    const release = jest.fn();
    await connectCallback(null, {}, release);
    expect(mockPoolQuery).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  it('should handle connection error', () => {
    require('../../config/db');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    connectCallback(new Error('Connection failed'), null, jest.fn());
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error acquiring client'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('should handle createTables error', async () => {
    require('../../config/db');
    mockPoolQuery.mockRejectedValueOnce(new Error('SQL error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const release = jest.fn();
    await connectCallback(null, {}, release);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error creating payments table'), expect.anything());
    consoleSpy.mockRestore();
  });
});
