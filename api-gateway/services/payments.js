const axios = require('axios');
const config = require('../config/services');

const BACKEND_PAYMENTS_URL = `http://backend-payments-service:3003`;

class PaymentService {
  
  async validatePaymentId(paymentId) {
    try {
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/validate/payment-id/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Payment ID validation service error:', error.message);
      return { exists: false, message: 'Payment validation service unavailable' };
    }
  }

  async getAllPayments(authHeader) {
    try {
      console.log('🚀 Calling backend-payments: GET /api/payments');
      const headers = authHeader ? { Authorization: authHeader } : {};
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/api/payments`, { headers });
      console.log(`✅ Backend response: ${response.data.length} payments`);
      return response.data;
    } catch (error) {
      console.error('❌ Get all payments service error:', error.message);
      throw error;
    }
  }

  async getPaymentById(id, authHeader) {
    try {
      console.log(`🚀 Calling backend-payments: GET /api/payments/${id}`);
      const headers = authHeader ? { Authorization: authHeader } : {};
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/api/payments/${id}`, { headers });
      console.log(`✅ Backend response: Payment ${response.data.payment_id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment by ID service error:', error.message);
      throw error;
    }
  }

  async getPaymentStatus(id, authHeader) {
    try {
      console.log(`🚀 Calling backend-payments: GET /api/payments/${id}/status`);
      const headers = authHeader ? { Authorization: authHeader } : {};
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/api/payments/${id}/status`, { headers });
      console.log(`✅ Backend response: Status ${response.data.status}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment status service error:', error.message);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;