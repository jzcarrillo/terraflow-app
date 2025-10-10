require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3003,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5435,
    name: process.env.DB_NAME || 'terraflow_payments',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8081',
      'http://api-gateway-service:8081'
    ]
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

module.exports = config;