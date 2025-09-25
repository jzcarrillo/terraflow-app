require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 8081,
    env: process.env.NODE_ENV || 'development'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672',
    queues: {
      landRegistry: process.env.QUEUE_LAND_REGISTRY || 'queue_land_registry'
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:30081']
  }
};

module.exports = config;