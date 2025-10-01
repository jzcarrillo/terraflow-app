// Generate JWT token with very long expiry
const crypto = require('crypto');

// JWT Header
const header = {
  "alg": "HS256",
  "typ": "JWT"
};

// JWT Payload (valid for 10 years)
const payload = {
  "username": "testuser",
  "id": 1,
  "exp": Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60), // 10 years
  "iat": Math.floor(Date.now() / 1000)
};

// Base64 URL encode
function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create signature
function createSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate JWT
const encodedHeader = base64UrlEncode(header);
const encodedPayload = base64UrlEncode(payload);
const data = `${encodedHeader}.${encodedPayload}`;
const secret = 'default-secret-key'; // Same as API Gateway default
const signature = createSignature(data, secret);
const jwt = `${data}.${signature}`;

console.log(jwt);