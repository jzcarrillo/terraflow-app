const jwt = require('jsonwebtoken');

// Generate CASHIER token
const tokenPayload = {
  user_id: 2,
  username: 'pinkysuliman',
  email: 'pinkysuliman@gmail.com',
  role: 'CASHIER'
};

const token = jwt.sign(tokenPayload, 'default-secret-key', {
  expiresIn: '24h'
});

console.log('\n=== CASHIER TOKEN ===');
console.log('Role: CASHIER (Payment access only)');
console.log('User:', tokenPayload.username);
console.log('Token:');
console.log(token);