const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// USER ENDPOINTS
router.post('/users', authenticateToken, userController.createUser);
router.get('/users/validate', userController.validateUser);

module.exports = router;