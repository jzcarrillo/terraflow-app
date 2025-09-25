const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const config = require('./config/services');
const { testConnection } = require('./config/db');
const landTitleProcessor = require('./processors/landTitleProcessor');

const app = express();

// MIDDLEWARE 
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

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
landTitleProcessor.startConsumer();

app.listen(config.server.port, () => {
  console.log(`Land Registry Service running on port ${config.server.port}`);
  console.log('Listening for land title processing messages...');
});