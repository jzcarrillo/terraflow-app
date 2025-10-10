const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const paymentRoutes = require('./routes/payments');
const validationRoutes = require('./routes/validation');
const consumer = require('./services/consumer');

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
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

// ROUTES
app.use('/', validationRoutes);
app.use('/api', paymentRoutes);

// START RABBITMQ CONSUMER
consumer.startConsumer();

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await consumer.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`🚀 Backend Payments running on port ${config.server.port}`);
});