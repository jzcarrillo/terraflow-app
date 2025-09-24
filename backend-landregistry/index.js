const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const landTitlesRoutes = require('./routes/landtitles');
const config = require('./config/services');

const app = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Land Registry Service' });
});

// Routes
app.use('/', landTitlesRoutes);

app.listen(config.server.port, () => {
  console.log(`Land Registry Service running on port ${config.server.port}`);
});