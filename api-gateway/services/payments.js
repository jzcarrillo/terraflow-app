const axios = require('axios');
const config = require('../config/services');

class PaymentService {
  
  // GET ALL PAYMENTS
  async getAllPayments() {
    try {
      const response = await axios.get(`${config.services.payments}/api/payments`);
      return response.data;
    } catch (error) {
      console.error('❌ Get all payments failed:', error.message);
      throw new Error('Payment service unavailable');
    }
  }

  // GET PAYMENT BY ID
  async getPaymentById(id) {
    try {
      const response = await axios.get(`${config.services.payments}/api/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment failed:', error.message);
      throw new Error('Payment service unavailable');
    }
  }

  // GET PAYMENT STATUS
  async getPaymentStatus(id) {
    try {
      const response = await axios.get(`${config.services.payments}/api/payments/${id}/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment status failed:', error.message);
      throw new Error('Payment service unavailable');
    }
  }

  // VALIDATE PAYMENT ID
  async validatePaymentId(paymentId) {
    try {
      const response = await axios.get(`${config.services.payments}/api/validate/payment-id?payment_id=${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Validate payment ID failed:', error.message);
      throw new Error('Payment service unavailable');
    }
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;