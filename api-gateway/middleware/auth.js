const jwt = require('jsonwebtoken');
const config = require('../config/services');

// AUTHENTICATE TOKEN
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// REFRESH TOKEN
const refreshToken = (req, res) => {
  try {
    const newToken = jwt.sign(
      { 
        user_id: req.user.user_id, 
        username: req.user.username,
        email: req.user.email,
        role: req.user.role 
      },
      config.jwt.secret,
      { expiresIn: '2h' }
    );
    
    console.log(`🔄 Token refreshed for user: ${req.user.username}`);
    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// GENERATE TOKEN
const generateToken = (req, res) => {
  try {
    const { user_id, username, email, role } = req.body;
    
    const token = jwt.sign(
      { user_id, username, email, role },
      config.jwt.secret,
      { expiresIn: '24h' }
    );
    
    console.log(`🔑 Fresh token generated for: ${username}`);
    res.json({ token });
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    res.status(500).json({ error: 'Token generation failed' });
  }
};

module.exports = { authenticateToken, refreshToken, generateToken };