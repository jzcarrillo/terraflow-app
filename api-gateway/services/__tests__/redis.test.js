const redisService = require('../redis');

jest.mock('redis');
const redis = require('redis');

describe('Redis Service', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      connect: jest.fn().mockResolvedValue(true),
      get: jest.fn(),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
      isOpen: true
    };
    
    redis.createClient = jest.fn().mockReturnValue(mockClient);
    redisService.client = null;
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const result = await redisService.connect();
      expect(result).toBe(true);
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should reuse existing connection', async () => {
      await redisService.connect();
      mockClient.connect.mockClear();
      
      await redisService.connect();
      expect(mockClient.connect).not.toHaveBeenCalled();
    });

    it('should reconnect if client not open', async () => {
      await redisService.connect();
      redisService.client.isOpen = false;
      redis.createClient.mockClear();
      
      await redisService.connect();
      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should handle error event', async () => {
      await redisService.connect();
      const errorHandler = mockClient.on.mock.calls.find(call => call[0] === 'error')[1];
      
      errorHandler(new Error('Redis error'));
      expect(redisService.client).toBeNull();
    });

    it('should handle connection error', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      const result = await redisService.connect();
      expect(result).toBe(false);
    });
  });

  describe('getLandTitles', () => {
    it('should get cached land titles', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify([{ id: 1 }]));
      const result = await redisService.getLandTitles();
      
      expect(result).toEqual([{ id: 1 }]);
      expect(mockClient.get).toHaveBeenCalledWith('land_titles:all');
    });

    it('should return null if not cached', async () => {
      mockClient.get.mockResolvedValue(null);
      const result = await redisService.getLandTitles();
      expect(result).toBeNull();
    });

    it('should return null if connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection error'));
      const result = await redisService.getLandTitles();
      expect(result).toBeNull();
    });

    it('should handle error', async () => {
      mockClient.get.mockRejectedValue(new Error('Get error'));
      const result = await redisService.getLandTitles();
      expect(result).toBeNull();
    });
  });

  describe('getLandTitle', () => {
    it('should get single cached land title', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ id: 1 }));
      const result = await redisService.getLandTitle(1);
      
      expect(result).toEqual({ id: 1 });
      expect(mockClient.get).toHaveBeenCalledWith('land_title:1');
    });

    it('should return null if not cached', async () => {
      mockClient.get.mockResolvedValue(null);
      const result = await redisService.getLandTitle(1);
      expect(result).toBeNull();
    });

    it('should return null if connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection error'));
      const result = await redisService.getLandTitle(1);
      expect(result).toBeNull();
    });
  });

  describe('cacheLandTitles', () => {
    it('should cache land titles', async () => {
      const data = [{ id: 1 }];
      const result = await redisService.cacheLandTitles(data);
      
      expect(result).toBe(true);
      expect(mockClient.setEx).toHaveBeenCalledWith('land_titles:all', 20, JSON.stringify(data));
    });

    it('should return false if connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection error'));
      const result = await redisService.cacheLandTitles([]);
      expect(result).toBe(false);
    });

    it('should handle cache error', async () => {
      mockClient.setEx.mockRejectedValue(new Error('Cache error'));
      const result = await redisService.cacheLandTitles([]);
      expect(result).toBe(false);
    });
  });

  describe('cacheLandTitle', () => {
    it('should cache single land title', async () => {
      const data = { id: 1 };
      const result = await redisService.cacheLandTitle(1, data);
      
      expect(result).toBe(true);
      expect(mockClient.setEx).toHaveBeenCalledWith('land_title:1', 20, JSON.stringify(data));
    });

    it('should return false if connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection error'));
      const result = await redisService.cacheLandTitle(1, {});
      expect(result).toBe(false);
    });
  });

  describe('clearLandTitlesCache', () => {
    it('should clear cache', async () => {
      const result = await redisService.clearLandTitlesCache();
      
      expect(result).toBe(true);
      expect(mockClient.del).toHaveBeenCalledWith('land_titles:all');
    });

    it('should return false if connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection error'));
      const result = await redisService.clearLandTitlesCache();
      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should close connection', async () => {
      redisService.client = mockClient;
      await redisService.close();
      expect(mockClient.quit).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle getLandTitle error', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis error'));
      const result = await redisService.getLandTitle(1);
      expect(result).toBeNull();
    });

    it('should handle cacheLandTitle error', async () => {
      mockClient.setEx.mockRejectedValue(new Error('Redis error'));
      const result = await redisService.cacheLandTitle(1, {});
      expect(result).toBe(false);
    });

    it('should handle clearLandTitlesCache error', async () => {
      mockClient.del.mockRejectedValue(new Error('Redis error'));
      const result = await redisService.clearLandTitlesCache();
      expect(result).toBe(false);
    });

    it('should handle close error gracefully', async () => {
      mockClient.quit.mockRejectedValue(new Error('Close error'));
      redisService.client = mockClient;
      await expect(redisService.close()).resolves.not.toThrow();
    });
  });
});
