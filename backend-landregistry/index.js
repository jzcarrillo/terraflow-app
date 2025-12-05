const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const config = require('./config/services');
const { testConnection } = require('./config/db');
const { startConsumer } = require('./services/consumer');
const rabbitmq = require('./utils/rabbitmq');

const app = express();

// MIDDLEWARE 
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// ROUTES
app.use('/api/land-titles', require('./routes/landtitles'));
app.use('/api/blockchain', require('./routes/blockchain'));

// HEALTH CHECK ENDPOINT ONLY
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'backend-landregistry',
    timestamp: new Date().toISOString()
  });
});

// TEST DATABASE CONNECTION
testConnection();

// START MESSAGE QUEUE CONSUMER
startConsumer();

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await rabbitmq.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`✅ Land Registry Service running on port ${config.server.port}`);
});