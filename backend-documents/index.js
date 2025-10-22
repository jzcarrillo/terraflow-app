require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const { initializeDatabase } = require('./config/db');
const { startConsumer } = require('./services/consumer');
const documentsRoutes = require('./routes/documents');
const rabbitmq = require('./utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;

// MIDDLEWARE 
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// HEALTH CHECK ENDPOINT
app.get('/health', (req, res) => {
  res.json({ 
    service: 'backend-documents',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API ROUTES
app.use('/api/documents', documentsRoutes);

// START SERVER
const startServer = async () => {
  try {
    await initializeDatabase();
    startConsumer();
    
    app.listen(PORT, () => {
      console.log(`✅ Documents Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Documents Service:', error);
    process.exit(1);
  }
};

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await rabbitmq.close();
  process.exit(0);
});

startServer();