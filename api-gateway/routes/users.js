const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// USER ENDPOINTS
router.post('/users', authenticateToken, userController.createUser);
router.get('/users/validate', userController.validateUser);
router.get('/users', authenticateToken, requireRole(['ADMIN']), userController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, requireRole(['ADMIN']), userController.updateUserRole);

module.exports = router;