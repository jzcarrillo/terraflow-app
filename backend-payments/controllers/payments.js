const paymentService = require('../services/payments');
const { handleError } = require('../utils/errorHandler');

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json(payments);
  } catch (error) {
    handleError(error, res, 'Get all payments');
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    handleError(error, res, 'Get payment');
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentStatus = await paymentService.getPaymentStatus(id);
    
    if (!paymentStatus) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(paymentStatus);
  } catch (error) {
    handleError(error, res, 'Get payment status');
  }
};

const validateLandTitlePayment = async (req, res) => {
  try {
    const { land_title_id, reference_type } = req.query;
    
    if (!land_title_id) {
      return res.status(400).json({ error: 'Land title ID is required' });
    }
    
    // Check for existing PENDING payment with same reference_type
    const pendingPayment = await paymentService.getExistingPendingPayment(land_title_id, reference_type);
    const exists = pendingPayment !== null;
    
    res.json({ exists });
  } catch (error) {
    handleError(error, res, 'Validate land title payment');
  }
};

const validatePaymentId = async (req, res) => {
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
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentStatus,
  validateLandTitlePayment,
  validatePaymentId
};