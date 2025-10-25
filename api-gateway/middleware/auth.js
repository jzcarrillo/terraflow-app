const { extractToken, verifyToken, generateToken } = require('../utils/tokenHelper');

// AUTHENTICATE TOKEN
const authenticateToken = (req, res, next) => {
  try {
    const token = extractToken(req);
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    const status = error.message === 'Access token required' ? 401 : 403;
    res.status(status).json({ error: error.message });
  }
};

// REQUIRE SPECIFIC ROLES
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const token = extractToken(req);
      const user = verifyToken(token);
      req.user = user;
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      const status = error.message === 'Access token required' ? 401 : 403;
      res.status(status).json({ error: error.message });
    }
  };
};

// REFRESH TOKEN
const refreshToken = (req, res) => {
  try {
    const newToken = generateToken({
      user_id: req.user.user_id, 
      username: req.user.username,
      email: req.user.email,
      role: req.user.role 
    }, '2h');
    
    console.log(`🔄 Token refreshed for user: ${req.user.username}`);
    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// GENERATE TOKEN ENDPOINT
const generateTokenEndpoint = (req, res) => {
  try {
    const { user_id, username, email, role } = req.body;
    const token = generateToken({ user_id, username, email, role });
    
    console.log(`🔑 Fresh token generated for: ${username}`);
    res.json({ token });
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    res.status(500).json({ error: 'Token generation failed' });
  }
};

module.exports = { authenticateToken, requireRole, refreshToken, generateTokenEndpoint };