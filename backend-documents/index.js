require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const consumer = require('./services/consumer');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Backend Documents',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    
    // Start RabbitMQ consumer
    await consumer.startConsumer();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Backend Documents running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Backend Documents:', error);
    process.exit(1);
  }
};

startServer();