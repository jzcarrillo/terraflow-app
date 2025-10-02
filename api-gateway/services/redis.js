const redis = require('redis');
const config = require('../config/services');

class RedisService {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      if (!this.client) {
        this.client = redis.createClient({
          socket: {
            host: config.redis.host,
            port: config.redis.port
          }
        });
        await this.client.connect();
        console.log('✅ Connected to Redis successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      return false;
    }
  }

// GET CACHE LAND TITLES
  async getLandTitles() {
    try {
      const connected = await this.connect();
      if (!connected) return null;

      const cached = await this.client.get('land_titles:all');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('❌ Redis get land titles error:', error.message);
      return null;
    }
  }

  // GET SINGLE CACHED LAND TITLE
  async getLandTitle(id) {
    try {
      const connected = await this.connect();
      if (!connected) return null;

      const cached = await this.client.get(`land_title:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('❌ Redis get land title error:', error.message);
      return null;
    }
  }

  // CACHE LAND TITLES
  async cacheLandTitles(data, ttl = 20) {
    try {
      const connected = await this.connect();
      if (!connected) return false;

      await this.client.setEx('land_titles:all', ttl, JSON.stringify(data));
      console.log('✅ Land titles cached in Redis');
      return true;
    } catch (error) {
      console.error('❌ Redis cache error:', error.message);
      return false;
    }
  }

  // CACHE SINGLE LAND TITLE
  async cacheLandTitle(id, data, ttl = 20) {
    try {
      const connected = await this.connect();
      if (!connected) return false;

      await this.client.setEx(`land_title:${id}`, ttl, JSON.stringify(data));
      console.log(`✅ Land title ${id} cached in Redis`);
      return true;
    } catch (error) {
      console.error('❌ Redis cache error:', error.message);
      return false;
    }
  }

  async clearLandTitlesCache() {
    try {
      const connected = await this.connect();
      if (!connected) return false;

      await this.client.del('land_titles:all');
      return true;
    } catch (error) {
      console.error('❌ Redis clear cache error:', error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
}

const redisService = new RedisService();
module.exports = redisService;