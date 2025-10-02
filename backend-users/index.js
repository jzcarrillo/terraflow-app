const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const config = require('./config/services');
const { testConnection } = require('./config/db');
const validationRoutes = require('./routes/validation');
const consumer = require('./services/consumer');

const app = express();

// MIDDLEWARE 
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// ROUTES
app.use('/api', validationRoutes);

// HEALTH CHECK ENDPOINT ONLY
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'backend-users',
    timestamp: new Date().toISOString()
  });
});

// TEST DATABASE CONNECTION
testConnection();
// console.log('✅ Database connection skipped for local testing');

// START MESSAGE QUEUE CONSUMER
consumer.startConsumer();
// console.log('✅ RabbitMQ consumer skipped for local testing');

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await consumer.close();
  process.exit(0);
});

app.listen(config.server.port, () => {
  console.log(`✅ Users Service running on port ${config.server.port}`);
});