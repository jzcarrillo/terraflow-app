const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { authenticateToken } = require('../middleware/auth');

// USER ENDPOINTS
router.get('/user/:username', userController.getUserByUsername);
router.get('/users', authenticateToken, userController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, userController.updateUserRole);
router.get('/validate', userController.validateUser);

module.exports = router;