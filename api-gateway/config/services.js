require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 8081,
    env: process.env.NODE_ENV || 'development'
  },
  services: {
    landRegistry: process.env.LANDREGISTRY_SERVICE_URL || 'http://backend-landregistry-service:3000',
    users: process.env.USERS_SERVICE_URL || 'http://backend-users-service:3001',
    payments: process.env.PAYMENTS_SERVICE_URL || 'http://backend-payments-service:3003'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672',
    queues: {
      landRegistry: process.env.QUEUE_LANDREGISTRY || 'queue_landregistry',
      users: process.env.QUEUE_USERS || 'queue_users',
      payments: process.env.QUEUE_PAYMENTS || 'queue_payments'
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis-service',
    port: process.env.REDIS_PORT || 6379
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:4005',
      'http://localhost:8081', 
      'http://localhost:30081',
      'http://backend-landregistry-service:3000',
      'http://backend-users-service:3001',
      'http://backend-payments-service:3003'
    ]
  }
};

module.exports = config;