const paymentStatus = require('../services/paymentStatus');

const processPaymentStatusUpdate = async (messageData) => {
  const { reference_id, status, payment_status } = messageData;
  
  try {
    console.log(`💳 Payment status update for reference: ${reference_id}`);
    console.log(`💳 Payment status: ${payment_status}, Land title status: ${status}`);
    
    const result = await paymentStatus.paymentStatusUpdate(messageData);
    
    if (result) {
      console.log(`✅ Land title status updated to ${status} for reference: ${reference_id}`);
    } else {
      console.log(`⚠️ No land title found for reference: ${reference_id}`);
    }
    
    return result;

  } catch (error) {
    console.error(`❌ Payment status processing failed: ${reference_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processPaymentStatusUpdate
};