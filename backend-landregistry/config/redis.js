const redis = require('redis');
const config = require('./services');

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

module.exports = client;