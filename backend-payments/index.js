const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const paymentRoutes = require('./routes/payments');
const { startConsumer } = require('./services/consumer');
const rabbitmq = require('./utils/rabbitmq');

const app = express();

// MIDDLEWARE
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'backend-payments',
    timestamp: new Date().toISOString()
  });
});

// ROUTES
app.use('/api', paymentRoutes);

// START RABBITMQ CONSUMER
startConsumer();

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await rabbitmq.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`✅ Payments Service running on port ${config.server.port}`);
});