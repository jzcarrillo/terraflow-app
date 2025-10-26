const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payments');
const { authenticateToken } = require('../middleware/auth');

// PAYMENT ENDPOINTS
router.get('/payments', authenticateToken, paymentController.getAllPayments);
router.get('/payments/:id', authenticateToken, paymentController.getPaymentById);
router.get('/payments/:id/status', authenticateToken, paymentController.getPaymentStatus);
router.get('/validate/land-title-payment', paymentController.validateLandTitlePayment);
router.get('/validate/payment-id/:paymentId', paymentController.validatePaymentId);

module.exports = router;