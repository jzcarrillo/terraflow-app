const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');

// AUTH ENDPOINTS (no authentication required)
router.post('/auth/login', userController.login);
router.post('/auth/register', userController.createUser);

module.exports = router;