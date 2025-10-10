const express = require('express');
const paymentService = require('../services/payments');
const router = express.Router();

// VALIDATE PAYMENT ID IF DUPLICATE
router.get('/validate/payment-id/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const exists = await paymentService.checkPaymentExists(paymentId);
    
    if (exists) {
      console.log(`❌ Payment ID already exists: ${paymentId}`);
      return res.json({
        exists: true,
        message: 'Payment ID already exists'
      });
    }
    
    console.log(`✅ Payment ID is available: ${paymentId}`);
    res.json({
      exists: false,
      message: 'Payment ID is available'
    });
    
  } catch (error) {
    console.error('❌ Payment ID validation error:', error.message);
    res.status(500).json({ exists: false, error: 'Database validation failed' });
  }
});

module.exports = router;