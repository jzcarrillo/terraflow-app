const config = require('../config/services');
const rabbitmq = require('../services/publisher');
const payments = require('../services/payments');
const { QUEUES, STATUS } = require('../config/constants');

// GET ALL PAYMENTS
const getAllPayments = async (req, res) => {
  try {
    console.log('💳 === GET ALL PAYMENTS ===');
    const response = await payments.getAllPayments();
    res.json(response);
  } catch (error) {
    console.error('❌ Get all payments error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💳 === GET PAYMENT BY ID: ${id} ===`);
    
    const response = await payments.getPaymentById(id);
    res.json(response);
  } catch (error) {
    console.error('❌ Get payment error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// CREATE PAYMENT
const createPayment = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    console.log('💳 === CREATE PAYMENT ===');
    console.log('📦 Request payload:', JSON.stringify(req.body, null, 2));
    
    // Validate payment ID if provided
    if (req.body.id) {
      const validation = await payments.validatePaymentId(req.body.id);
      if (validation.exists) {
        return res.status(400).json({ 
          error: 'Duplicate payment exists',
          message: `Payment with ID ${req.body.id} already exists`
        });
      }
    }
    
    const payload = {
      transaction_id: transactionId,
      payment_data: req.body,
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    
    res.status(202).json({
      success: true,
      message: 'Payment creation request received and is being processed',
      transaction_id: transactionId,
      status: STATUS.PENDING
    });

  } catch (error) {
    console.error('❌ Create payment error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// EDIT PAYMENT
const editPayment = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    console.log(`💳 === EDIT PAYMENT: ${id} ===`);
    
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_PAYMENT',
      payment_id: id,
      payment_data: req.body,
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    
    res.status(202).json({
      success: true,
      message: 'Payment update request received and is being processed',
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('❌ Edit payment error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// CANCEL PAYMENT
const cancelPayment = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    console.log(`💳 === CANCEL PAYMENT: ${id} ===`);
    
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_STATUS',
      payment_id: id,
      status: 'CANCELLED',
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    
    res.status(202).json({
      success: true,
      message: 'Payment cancellation request received and is being processed',
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('❌ Cancel payment error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// CONFIRM PAYMENT
const confirmPayment = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    console.log(`💳 === CONFIRM PAYMENT: ${id} ===`);
    
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_STATUS',
      payment_id: id,
      status: 'PAID',
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    
    res.status(202).json({
      success: true,
      message: 'Payment confirmation request received and is being processed',
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('❌ Confirm payment error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};



// GET PAYMENT STATUS
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💳 === GET PAYMENT STATUS: ${id} ===`);
    
    const response = await payments.getPaymentStatus(id);
    res.json(response);
  } catch (error) {
    console.error('❌ Get payment status error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

// VALIDATE PAYMENT ID
const validatePaymentId = async (req, res) => {
  try {
    const { payment_id } = req.query;
    
    if (!payment_id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }
    
    console.log(`💳 === VALIDATE PAYMENT ID: ${payment_id} ===`);
    
    const validation = await payments.validatePaymentId(payment_id);
    res.json(validation);
  } catch (error) {
    console.error('❌ Validate payment ID error:', error.message);
    res.status(500).json({ error: 'Payment service unavailable' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  editPayment,
  cancelPayment,
  confirmPayment,
  getPaymentStatus,
  validatePaymentId
};