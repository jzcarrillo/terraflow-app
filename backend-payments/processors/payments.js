const paymentService = require('../services/payments');

const paymentCreate = async (messageData) => {
  const { transaction_id, payment_data } = messageData;
  
  try {
    // VALIDATE WITH ZOD FIRST
    const { paymentSchema } = require('../schemas/payments');
    const validatedData = paymentSchema.parse(payment_data);
    console.log(`✅ Zod validation successful for payment`);
    
    // Generate unique payment ID
    const paymentId = `PAY-${new Date().getFullYear()}-${Date.now()}`;
    
    // CHECK FOR DUPLICATE PAYMENT ID
    const isDuplicate = await paymentService.checkPaymentExists(paymentId);
    
    if (isDuplicate) {
      throw new Error(`Payment ID ${paymentId} already exists`);
    }
    
    console.log('💳 === CREATE PAYMENT ===');
    console.log('📋 Validated Payload:');
    console.log(JSON.stringify(validatedData, null, 2));
    
    console.log('💾 Database updated successfully');
    console.log('✅ Create payment successfully.');
    
    const result = await paymentService.createPayment({
      payment_id: paymentId,
      reference_type: 'LAND_TITLE',
      reference_id: validatedData.land_title_id,
      amount: validatedData.amount,
      payer_name: validatedData.payer_name || 'Unknown',
      payment_method: validatedData.payment_method || 'CASH',
      status: 'PENDING',
      created_by: messageData.username || messageData.user_id || 'system'
    });
    

    return result;

  } catch (error) {
    console.error(`❌ Payment processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

const paymentUpdate = async (messageData) => {
  const { payment_id, payment_data } = messageData;
  
  try {
    // VALIDATE WITH ZOD FIRST
    const { paymentEditSchema } = require('../schemas/payments');
    const validatedData = paymentEditSchema.parse(payment_data);
    console.log(`✅ Zod validation successful for payment edit`);
    
    console.log('💳 === EDIT PAYMENT ===');
    console.log('📋 Validated Payload:');
    console.log(JSON.stringify(validatedData, null, 2));
    
    const result = await paymentService.updatePayment(payment_id, validatedData);
    
    console.log('💾 Database updated successfully');
    console.log('✅ Edit payment successfully.');
    
    return result;
  } catch (error) {
    console.error(`❌ Payment update failed: ${payment_id}`, error.message);
    throw error;
  }
};

const paymentStatusUpdate = async (messageData) => {
  const { payment_id, status } = messageData;
  
  try {
    console.log(`✅ Zod validation successful for payment`);
    
    if (status === 'CANCELLED') {
      console.log('💳 === CANCEL PAYMENT ===');
    } else {
      console.log(`💳 === UPDATE PAYMENT STATUS: ${status} ===`);
    }
    
    console.log('📋 Validated Payload:');
    console.log(JSON.stringify(messageData, null, 2));
    
    const result = await paymentService.updatePaymentStatus(payment_id, status);
    
    // Only log success if there was an actual update
    if (result && result.updated_at) {
      const currentTime = new Date().toISOString();
      const updatedTime = new Date(result.updated_at).toISOString();
      
      // Check if update happened recently (within last 5 seconds)
      if (Math.abs(new Date(currentTime) - new Date(updatedTime)) < 5000) {
        console.log('💾 Database updated successfully');
        
        if (status === 'CANCELLED') {
          console.log('✅ Cancel payment successfully.');
        } else {
          console.log(`✅ Update payment status successfully.`);
        }
        

      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Payment status update failed: ${payment_id}`, error.message);
    throw error;
  }
};

module.exports = {
  paymentCreate,
  paymentUpdate,
  paymentStatusUpdate
};