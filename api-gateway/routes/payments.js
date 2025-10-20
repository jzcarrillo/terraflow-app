const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payments');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// PAYMENT ENDPOINTS - CASHIER has full access
router.get('/payments', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.getAllPayments);
router.get('/payments/:id', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.getPaymentById);
router.post('/payments', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.createPayment);
router.put('/payments/:id', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.editPayment);
router.put('/payments/:id/cancel', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.cancelPayment);
router.put('/payments/:id/confirm', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.confirmPayment);
router.get('/payments/:id/status', authenticateToken, requireRole(['ADMIN', 'CASHIER']), paymentController.getPaymentStatus);

module.exports = router;