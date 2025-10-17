const jwt = require('jsonwebtoken');
const config = require('../config/services');

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      
      // Check if user role is allowed
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

module.exports = { requireRole };