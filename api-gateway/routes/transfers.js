const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfers');
const { authenticateToken, requireRole } = require('../middleware/auth');

// TRANSFER ENDPOINTS
router.get('/transfers', authenticateToken, requireRole(['ADMIN', 'CASHIER']), transferController.getAllTransfers);
router.get('/transfers/:id', authenticateToken, requireRole(['ADMIN', 'CASHIER']), transferController.getTransferById);
router.post('/transfers', authenticateToken, requireRole(['ADMIN', 'CASHIER']), transferController.createTransfer);
router.put('/transfers/:id', authenticateToken, requireRole(['ADMIN', 'CASHIER']), transferController.updateTransferStatus);
router.put('/transfers/:id/complete', authenticateToken, requireRole(['ADMIN', 'CASHIER']), transferController.completeTransfer);

module.exports = router;