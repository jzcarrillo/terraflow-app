const config = require('../config/services');
const rabbitmq = require('../services/publisher');
const payments = require('../services/payments');
const landtitles = require('../services/landtitles');
const { QUEUES, STATUS } = require('../config/constants');

// GET ALL PAYMENTS
const getAllPayments = async (req, res) => {
  try {
    console.log('💳 === GET ALL PAYMENTS ===');
    const response = await payments.getAllPayments(req.headers.authorization);
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
    
    const response = await payments.getPaymentById(id, req.headers.authorization);
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
// VALIDATE REQUEST USING ZOD
    const { paymentSchema } = require('../schemas/payments');
    const validatedData = paymentSchema.parse(req.body);

// VALIDATE LAND TITLE EXISTS
    const landTitleValidation = await landtitles.validateLandTitleExists(validatedData.land_title_id);
    
    if (!landTitleValidation.exists) {
      console.log('❌ Land title does not exist');
      return res.status(404).json({ 
        error: 'Reference ID does not exist',
        message: `Land title ${validatedData.land_title_id} does not exist`
      });
    }

// VALIDATE LAND TITLE PAYMENT
    const validation = await payments.validateLandTitlePayment(validatedData.land_title_id);
    
    if (validation.exists) {
      console.log('❌ Payment already exists for this land title');
      return res.status(409).json({ 
        error: 'Payment already exists for this land title',
        message: `A pending payment already exists for land title ${validatedData.land_title_id}`
      });
    }

// GENERATE PAYMENT ID
    const paymentId = `PAY-${new Date().getFullYear()}-${Date.now()}`;

    console.log('💳 === CREATE PAYMENT ===');
    console.log('📦 Request Payload:');
    console.log(JSON.stringify(validatedData, null, 2));
    console.log('✅ Zod validation successful for payment');
    
    const payload = {
      transaction_id: transactionId,
      payment_id: paymentId,
      reference_id: validatedData.land_title_id,
      reference_type: validatedData.reference_type,
      payment_data: validatedData,
      user_id: req.user.id,
      username: req.user.username || 'CASHIER 1',
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    console.log('📤 Message published to queue_payments');
    
    res.status(202).json({
      success: true,
      message: 'Payment creation request received and is being processed',
      transaction_id: transactionId,
      payment_id: paymentId,
      status: STATUS.PENDING
    });

  } catch (error) {
    const ErrorHandler = require('../utils/errorHandler');
    ErrorHandler.handleError(error, res, 'Create payment');
  }
};

// EDIT PAYMENT
    const editPayment = async (req, res) => {
    const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    console.log(`💳 === EDIT PAYMENT: ${id} ===`);
    
// VALIDATE REQUEST USING ZOD
    const { paymentEditSchema } = require('../schemas/payments');
    const validatedData = paymentEditSchema.parse(req.body);
    console.log('✅ Zod validation successful for Update Payment details');
    
    console.log('📋 Request Payload:');
    console.log(JSON.stringify(validatedData, null, 2));
    
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_PAYMENT',
      payment_id: id,
      reference_id: validatedData.land_title_id,
      reference_type: validatedData.reference_type,
      payment_data: validatedData,
      user_id: req.user.id,
      username: req.user.username || 'CASHIER 1',
      timestamp: new Date().toISOString()
    };

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    console.log('📤 Message published to message queue: queue_payments');
    
    res.status(202).json({
      success: true,
      message: 'Payment update request received and is being processed',
      transaction_id: transactionId
    });

  } catch (error) {
    const ErrorHandler = require('../utils/errorHandler');
    ErrorHandler.handleError(error, res, 'Edit payment');
  }
};

// CANCEL PAYMENT
  const cancelPayment = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    console.log(`💳 === CANCEL PAYMENT: ${id} ===`);

    
// GET PAYMENT DETAILS
    const paymentDetails = await payments.getPaymentById(id, req.headers.authorization);
    
// VALIDATE PAYMENT STATUS
    const statusCheck = await payments.getPaymentStatus(id, req.headers.authorization);
    
    if (statusCheck.status === 'CANCELLED') {
      console.log('❌ Payment already cancelled');
      return res.status(400).json({ 
        error: 'Payment already cancelled',
        message: `Payment ${id} is already cancelled`
      });
    }
      
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_STATUS',
      payment_id: paymentDetails.payment_id,
      status: 'CANCELLED',
      user_id: req.user.id,
      username: req.user.username || 'CASHIER 1'
    };

    console.log('📋 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    console.log('📤 Message published to message queue: queue_payments');
  
    
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
    
// GET PAYMENT DETAILS
    const paymentDetails = await payments.getPaymentById(id, req.headers.authorization);
    
// VALIDATE PAYMENT STATUS
    const statusCheck = await payments.getPaymentStatus(id, req.headers.authorization);
    
    if (statusCheck.status === 'PAID') {
      console.log('❌ Payment already paid');
      return res.status(400).json({ 
        error: 'Payment already paid',
        message: `Payment ${id} is already paid`
      });
    }
    
    if (statusCheck.status === 'CANCELLED') {
      console.log('❌ Cannot confirm cancelled payment');
      return res.status(400).json({ 
        error: 'Cannot confirm cancelled payment',
        message: `Payment ${id} is cancelled and cannot be confirmed`
      });
    }
    
    const payload = {
      transaction_id: transactionId,
      action: 'UPDATE_STATUS',
      payment_id: paymentDetails.payment_id,
      status: 'PAID',
      user_id: req.user.id,
      username: req.user.username || 'CASHIER 1'
    };

    console.log('📋 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));

    await rabbitmq.publishToQueue(QUEUES.PAYMENTS, payload);
    console.log('📤 Message published to message queue: queue_payments');
    
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
    
    const response = await payments.getPaymentStatus(id, req.headers.authorization);
    res.json(response);
  } catch (error) {
    console.error('❌ Get payment status error:', error.message);
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
  getPaymentStatus
};