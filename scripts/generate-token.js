const jwt = require('jsonwebtoken');

// Use the same secret as API Gateway
const JWT_SECRET = 'default-secret-key';

// Create a test user payload
const payload = {
  username: 'testuser',
  id: 1,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
};

// Generate token
const token = jwt.sign(payload, JWT_SECRET);

console.log('Generated JWT Token:');
console.log(token);
console.log('\nToken expires in 24 hours');
console.log('Copy this token to your PowerShell script');