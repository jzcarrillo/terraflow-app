const jwt = require('jsonwebtoken');

// Generate a fresh JWT token for jzcarrillo
const tokenPayload = {
  user_id: 2,
  username: 'jzcarrillo',
  email: 'jzcarrillo@example.com',
  role: 'ADMIN'
};

const token = jwt.sign(tokenPayload, 'default-secret-key', {
  expiresIn: '24h'
});

console.log('\n=== LONG-LASTING TOKEN ===');
console.log('Expires in: 24 hours');
console.log('No session expiry issues');

console.log('Fresh JWT Token with role:');
console.log(token);
console.log('\nToken payload:');
console.log(JSON.stringify(tokenPayload, null, 2));