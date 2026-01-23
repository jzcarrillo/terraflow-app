const axios = require('axios');
const config = require('../config/services');

const BACKEND_PAYMENTS_URL = `http://backend-payments-service:3003`;

class PaymentService {
  
  // VALIDATE PAYMENT ID IF DUPLICATE
  async validatePaymentId(paymentId) {
    try {
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/validate/payment-id/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Payment ID validation service error:', error.message);
      return { exists: false, message: 'Payment validation service unavailable' };
    }
  }

 // VALIDATE LAND TITLE NUMBER IF DUPLICATE
  async validateLandTitlePayment(landTitleId, referenceType = null) {
    try {
      console.log ('💳 === VALIDATE PAYMENT ===');
      console.log(`🔍 Validating land title payment: ${landTitleId} (${referenceType})`);
      let url = `${BACKEND_PAYMENTS_URL}/api/validate/land-title-payment?land_title_id=${landTitleId}`;
      if (referenceType) {
        url += `&reference_type=${encodeURIComponent(referenceType)}`;
      }
      const response = await axios.get(url);
      console.log(`✅ Validation result: ${response.data.exists}`);
      return response.data;
    } catch (error) {
      console.error('❌ Land title payment validation service error:', error.message);
      // Return exists: true on error to be safe and prevent duplicates
      return { exists: true, message: 'Validation service error - blocking creation for safety' };
    }
  }

// GET ALL PAYMENTS
  async getAllPayments(authHeader) {
    try {
      
      const headers = authHeader ? { Authorization: authHeader } : {};
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/api/payments`, { headers });
      console.log(`✅ Backend response: ${response.data.length} payments`);
      return response.data;
    } catch (error) {
      console.error('❌ Get all payments service error:', error.message);
      throw error;
    }
  }

  // GET PAYMENTS BY ID
  async getPaymentById(id, authHeader) {
    try {
      
      const headers = authHeader ? { Authorization: authHeader } : {};
      const response = await axios.get(`${BACKEND_PAYMENTS_URL}/api/payments/${id}`, { headers });
      console.log(`✅ Backend Payment ${response.data.payment_id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment by ID service error:', error.message);
      throw error;
    }
  }

  // GET PAYMENT STATUS
  async getPaymentStatus(id, authHeader) {
    try {
      
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