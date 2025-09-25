const express = require('express');
const helmet = require('helmet');
const config = require('./config/services');
const corsMiddleware = require('./middleware/cors');
const landTitleRoutes = require('./routes/landTitles');

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

app.listen(config.server.port, () => {
  console.log(`API Gateway running on port ${config.server.port}`);
  console.log(`Environment: ${config.server.env}`);
});