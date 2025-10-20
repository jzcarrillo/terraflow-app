const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { authenticateToken, refreshToken, generateToken } = require('../middleware/auth');

// AUTH ENDPOINTS
router.post('/auth/login', userController.login);
router.post('/auth/register', userController.createUser);
router.post('/auth/refresh', authenticateToken, refreshToken);
router.post('/auth/generate-token', generateToken);

module.exports = router;