const { executeQuery, findById, updateById } = require('../utils/database');
const { TABLES, STATUS } = require('../config/constants');
const rabbitmq = require('../utils/rabbitmq');
const { QUEUES } = require('../config/constants');

class PaymentService {

  async getAllPayments() {
    const result = await executeQuery(`SELECT * FROM ${TABLES.PAYMENTS} ORDER BY created_at DESC`);
    console.log(`📋 Retrieved ${result.rows.length} payments`);
    return result.rows;
  }

  async getPaymentById(id) {
    return await findById(TABLES.PAYMENTS, id);
  }

  async createPayment(data) {
    const { 
      payment_id, reference_type, reference_id, amount, payer_name, 
      payment_method = 'CASH', status = STATUS.PENDING, created_by
    } = data;

    const result = await executeQuery(`
      INSERT INTO ${TABLES.PAYMENTS} (
        payment_id, reference_type, reference_id, amount, payer_name, 
        payment_method, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [payment_id, reference_type, reference_id, amount, payer_name, payment_method, status, created_by]);

    console.log(`✅ Payment created: ${payment_id} for ${reference_id}`);
    console.log('💾 Data inserted to database successfully')
    console.log(`⏳ STATUS: PENDING`);
    return result.rows[0];
  }

  async updatePayment(id, data) {
    if (Object.keys(data).length === 0) {
      throw new Error('No fields to update');
    }
    
    const result = await updateById(TABLES.PAYMENTS, id, data);
    
    if (!result) {
      throw new Error(`Payment with ID ${id} not found`);
    }
    
    console.log('💾 Data updated to database successfully');
    return result;
  }

  async updatePaymentStatus(id, status, userId = null, transactionId = null) {
    const currentPayment = await this.getPaymentById(id);
    if (!currentPayment) {
      throw new Error(`Payment with ID ${id} not found`);
    }
    
    if (currentPayment.status === status) {
      return currentPayment;
    }
    
    const updateData = { status };
    
    if (status === STATUS.PAID) {
      updateData.confirmed_by = userId;
      updateData.confirmed_at = 'NOW()';
    } else if (status === 'CANCELLED') {
      updateData.cancelled_by = userId;
      updateData.cancelled_at = 'NOW()';
    }
    
    const result = await executeQuery(`
      UPDATE ${TABLES.PAYMENTS} 
      SET status = $1, ${status === STATUS.PAID ? 'confirmed_by = $2, confirmed_at = NOW(),' : status === 'CANCELLED' ? 'cancelled_by = $2, cancelled_at = NOW(),' : ''} updated_at = NOW()
      WHERE id = $${userId ? 3 : 2}
      RETURNING *
    `, userId ? [status, userId, id] : [status, id]);
    
    const updatedPayment = result.rows[0];
    
    console.log('✅ Payment status updated successfully');
    console.log('💾 Data updated to database successfully');
    
    if (updatedPayment && (status === STATUS.PAID || status === 'CANCELLED')) {
      await this.publishStatusUpdate(updatedPayment, status, transactionId);
    }
    
    return updatedPayment;
  }

  async publishStatusUpdate(payment, status, transactionId = null) {
    const landTitleStatus = status === STATUS.PAID ? 'ACTIVE' : 'PENDING';
    
    await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, {
      event_type: 'PAYMENT_STATUS_UPDATE',
      transaction_id: transactionId,
      payment_id: payment.id,
      reference_id: payment.reference_id,
      status: landTitleStatus,
      payment_status: payment.status,
      timestamp: new Date().toISOString()
    });
    
    console.log('📤 Message published to queue_landregistry');
  }
  
  async handleLandTitleResponse(messageData) {
    const { event_type, reference_id, new_status } = messageData;
    
    if (event_type === 'LAND_TITLE_STATUS_UPDATE_SUCCESS') {
      console.log(`🎆 Land title ${reference_id} successfully updated to ${new_status}`);
      console.log('✅ Payment processing completed successfully');
    } else if (event_type === 'LAND_TITLE_STATUS_UPDATE_FAILED') {
      console.log(`❌ Land title update failed for ${reference_id}: ${messageData.error}`);
    }
  }

  async getPaymentStatus(id) {
    const result = await executeQuery(`SELECT id, status, reference_id, updated_at FROM ${TABLES.PAYMENTS} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async checkPaymentExists(paymentId) {
    const result = await executeQuery(`SELECT id FROM ${TABLES.PAYMENTS} WHERE payment_id = $1`, [paymentId]);
    return result.rows.length > 0;
  }

  async checkLandTitlePaymentExists(landTitleId) {
    const result = await executeQuery(`SELECT id FROM ${TABLES.PAYMENTS} WHERE reference_id = $1 AND status = 'PENDING'`, [landTitleId]);
    return result.rows.length > 0;
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;