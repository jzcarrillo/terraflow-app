const jwt = require('jsonwebtoken');

// Generate a fresh JWT token with role field
const tokenPayload = {
  user_id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN'
};

const token = jwt.sign(tokenPayload, 'default-secret-key', {
  expiresIn: '24h'
});

console.log('Fresh JWT Token with role:');
console.log(token);
console.log('\nToken payload:');
console.log(JSON.stringify(tokenPayload, null, 2));