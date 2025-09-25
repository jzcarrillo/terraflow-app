const config = require('../config/services');

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // CHECK IF ORIGIN IS ALLOWED
  if (config.cors.allowedOrigins.includes(origin) || config.cors.allowedOrigins.includes('*')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // HANDLE PREFLIGHT REQUESTS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = corsMiddleware;