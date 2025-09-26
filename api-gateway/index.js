const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const landTitleRoutes = require('./routes/landTitles');
const rabbitmqService = require('./services/rabbitmqService');
const redisService = require('./services/redisService');

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

// INITIALIZE SERVICES
rabbitmqService.initialize();
redisService.connect();

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await rabbitmqService.close();
  await redisService.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`🚀 API Gateway running on port ${config.server.port}`);
});