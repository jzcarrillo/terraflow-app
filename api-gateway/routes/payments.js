const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payments');
const { authenticateToken } = require('../middleware/auth');

// PAYMENT ENDPOINTS
router.get('/payments', authenticateToken, paymentController.getAllPayments);
router.get('/payments/:id', authenticateToken, paymentController.getPaymentById);
router.post('/payments', authenticateToken, paymentController.createPayment);
router.put('/payments/:id', authenticateToken, paymentController.editPayment);
router.put('/payments/:id/cancel', authenticateToken, paymentController.cancelPayment);
router.put('/payments/:id/confirm', authenticateToken, paymentController.confirmPayment);
router.get('/payments/:id/status', authenticateToken, paymentController.getPaymentStatus);

module.exports = router;