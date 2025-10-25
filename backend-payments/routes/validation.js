const express = require('express');
const paymentService = require('../services/payments');
const { handleError } = require('../utils/errorHandler');
const router = express.Router();

// VALIDATE PAYMENT ID
router.get('/validate/payment-id/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const exists = await paymentService.checkPaymentExists(paymentId);
    
    res.json({
      exists,
      message: exists ? 'Payment ID already exists' : 'Payment ID is available'
    });
  } catch (error) {
    handleError(error, res, 'Payment ID validation');
  }
});

module.exports = router;