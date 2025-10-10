const express = require('express');
const paymentService = require('../services/payments');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET ALL PAYMENTS
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    console.log('💳 === GET ALL PAYMENTS ===');
    const payments = await paymentService.getAllPayments();
    console.log(`✅ Retrieved ${payments.length} payments successfully`);
    res.json(payments);
  } catch (error) {
    console.error('❌ Get all payments error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET PAYMENT BY ID
router.get('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💳 === GET PAYMENT BY ID: ${id} ===`);
    const payment = await paymentService.getPaymentById(id);
    
    if (!payment) {
      console.log(`⚠️ Payment not found: ${id}`);
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    console.log(`✅ Payment retrieved successfully: ${payment.payment_id}`);
    res.json(payment);
  } catch (error) {
    console.error('❌ Get payment error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET PAYMENT STATUS
router.get('/payments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💳 === GET PAYMENT STATUS: ${id} ===`);
    const paymentStatus = await paymentService.getPaymentStatus(id);
    
    if (!paymentStatus) {
      console.log(`⚠️ Payment status not found: ${id}`);
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    console.log(`✅ Payment status retrieved: ${paymentStatus.status}`);
    res.json(paymentStatus);
  } catch (error) {
    console.error('❌ Get payment status error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});



// VALIDATE LAND TITLE PAYMENT
router.get('/validate/land-title-payment', async (req, res) => {
  try {
    const { land_title_id } = req.query;
    
    if (!land_title_id) {
      return res.status(400).json({ error: 'Land title ID is required' });
    }
    
    console.log(`🔍 === VALIDATE LAND TITLE PAYMENT: ${land_title_id} ===`);
    const exists = await paymentService.checkLandTitlePaymentExists(land_title_id);
    console.log(`📤 Returning validation result: { exists: ${exists} }`);
    res.json({ exists });
  } catch (error) {
    console.error('Validate land title payment error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;