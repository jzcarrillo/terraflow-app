const CacheHelper = require('../cacheHelper');
const redisService = require('../../services/redis');

jest.mock('../../services/redis');

describe('CacheHelper', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      setEx: jest.fn().mockResolvedValue('OK')
    };
    
    redisService.connect = jest.fn().mockResolvedValue(true);
    redisService.client = mockClient;
  });

  describe('getCachedOrFetch', () => {
    it('should return cached data if available', async () => {
      const cachedData = { id: 1, name: 'Test' };
      mockClient.get.mockResolvedValue(JSON.stringify(cachedData));
      
      const fetchFn = jest.fn();
      const result = await CacheHelper.getCachedOrFetch('test:key', fetchFn);
      
      expect(result.data).toEqual(cachedData);
      expect(result.source).toBe('redis');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in cache', async () => {
      mockClient.get.mockResolvedValue(null);
      const freshData = { id: 2, name: 'Fresh' };
      const fetchFn = jest.fn().mockResolvedValue(freshData);
      
      const result = await CacheHelper.getCachedOrFetch('test:key', fetchFn);
      
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('database');
      expect(fetchFn).toHaveBeenCalled();
      expect(mockClient.setEx).toHaveBeenCalled();
    });

    it('should fallback to fetch on cache error', async () => {
      redisService.connect.mockRejectedValue(new Error('Redis error'));
      const freshData = { id: 3 };
      const fetchFn = jest.fn().mockResolvedValue(freshData);
      
      const result = await CacheHelper.getCachedOrFetch('test:key', fetchFn);
      
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('database');
    });
  });

  describe('formatResponse', () => {
    it('should format response correctly', () => {
      const result = CacheHelper.formatResponse('Success', { id: 1 }, 'redis', 123);
      
      expect(result).toEqual({
        message: 'Success',
        data: { id: 1 },
        source: 'redis',
        user: 123
      });
    });
  });
});
