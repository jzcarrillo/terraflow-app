const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const landTitleRoutes = require('./routes/landTitles');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const rabbitmq = require('./services/rabbitmq');
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

// INITIALIZE SERVICES
rabbitmq.initialize();
redis.connect();

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