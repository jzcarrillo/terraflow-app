const jwt = require('jsonwebtoken');
const config = require('../config/services');

// EXTRACT TOKEN FROM REQUEST
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.replace('Bearer ', '') || null;
};

// VERIFY TOKEN AND RETURN DECODED DATA
const verifyToken = (token) => {
  if (!token) {
    throw new Error('Access token required');
  }
  
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// GENERATE NEW TOKEN
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

module.exports = {
  extractToken,
  verifyToken,
  generateToken
};