const redisService = require('../services/redis');
const { CACHE } = require('../config/constants');

class CacheHelper {
  
// GENERIC CACHE-FIRST DATA RETRIEVAL
  static async getCachedOrFetch(cacheKey, fetchFunction, ttl = CACHE.TTL_SECONDS) {
    try {
      
// CHECK CACHE FIRST
      const connected = await redisService.connect();
      if (connected && redisService.client) {
        const cached = await redisService.client.get(cacheKey);
        if (cached) {
          return {
            data: JSON.parse(cached),
            source: 'redis'
          };
        }
      }

// CACHE MISS - FETCH FROM SOURCE
      const freshData = await fetchFunction();
      
// CACHE THE RESULT
      if (connected && redisService.client) {
        await redisService.client.setEx(cacheKey, ttl, JSON.stringify(freshData));
      }
      
      return {
        data: freshData,
        source: 'database'
      };
      
    } catch (error) {
      console.error('Cache helper error:', error.message);
      
// FALLBACK TO DIRECT FETCH IF CACHE FAILS
      const freshData = await fetchFunction();
      return {
        data: freshData,
        source: 'database'
      };
    }
  }

// STANDARD RESPONSE FORMATTER
  static formatResponse(message, data, source, userId) {
    return {
      message,
      data,
      source,
      user: userId
    };
  }
}

module.exports = CacheHelper;