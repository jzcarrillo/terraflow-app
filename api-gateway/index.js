const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const landTitleRoutes = require('./routes/landtitles');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const rabbitmq = require('./services/publisher');
const redis = require('./services/redis');

const app = express();

// MIDDLEWARE
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());



// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

// ROUTES
app.use('/api', landTitleRoutes);
app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', paymentRoutes);

// INITIALIZE SERVICES 
rabbitmq.initialize();
redis.connect();

// GLOBAL ERROR HANDLERS
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await rabbitmq.close();
  await redis.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`🚀 API Gateway running on port ${config.server.port}`);
});