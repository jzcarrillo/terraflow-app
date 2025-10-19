const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config/services');

// AUTH ENDPOINTS (no authentication required)
router.post('/auth/login', userController.login);
router.post('/auth/register', userController.createUser);

// TOKEN REFRESH ENDPOINT (sliding session)
router.post('/auth/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token with extended expiry
    const newToken = jwt.sign(
      { 
        user_id: req.user.user_id, 
        username: req.user.username,
        email: req.user.email,
        role: req.user.role 
      },
      config.jwt.secret,
      { expiresIn: '2h' } // Extend by 2 hours on each request
    );
    
    console.log(`🔄 Token refreshed for user: ${req.user.username}`);
    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;