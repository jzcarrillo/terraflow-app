const paymentStatus = require('../services/paymentStatus');

const processPaymentStatusUpdate = async (messageData) => {
  const { transaction_id, status, payment_status } = messageData;
  
  try {
    console.log(`💳 Processing payment status update for transaction: ${transaction_id}`);
    console.log(`💳 Payment status: ${payment_status}, Land title status: ${status}`);
    
    const result = await paymentStatus.paymentStatusUpdate(messageData);
    
    if (result) {
      console.log(`✅ Land title status updated to ${status} for transaction: ${transaction_id}`);
    } else {
      console.log(`⚠️ No land title found for transaction: ${transaction_id}`);
    }
    
    return result;

  } catch (error) {
    console.error(`❌ Payment status processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processPaymentStatusUpdate
};