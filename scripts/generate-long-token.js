const jwt = require('jsonwebtoken');

// JWT secret (same as in your API Gateway)
const JWT_SECRET = 'default-secret-key';

// Create payload with 10-year expiry
const payload = {
    user_id: 1,
    username: 'ADMIN',
    email: 'admin@example.com',
    role: 'ADMIN',
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60), // 10 years
    iat: Math.floor(Date.now() / 1000)
};

// Generate token
const token = jwt.sign(payload, JWT_SECRET);

// Output token (PowerShell will capture this)
console.log(token);