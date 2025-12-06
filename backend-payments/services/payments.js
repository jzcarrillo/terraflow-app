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
  
  async updatePaymentStatusByPaymentId(paymentId, status, userId = null, transactionId = null) {
    // First get the payment by payment_id to get the database ID
    const result = await executeQuery(`SELECT * FROM ${TABLES.PAYMENTS} WHERE payment_id = $1`, [paymentId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Payment with payment_id ${paymentId} not found`);
    }
    
    const currentPayment = result.rows[0];
    
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
    
    let updateQuery, params;
    
    if (userId) {
      if (status === STATUS.PAID) {
        updateQuery = `
          UPDATE ${TABLES.PAYMENTS} 
          SET status = $1, confirmed_by = $2, confirmed_at = NOW(), updated_at = NOW()
          WHERE payment_id = $3
          RETURNING *
        `;
        params = [status, userId, paymentId];
      } else if (status === 'CANCELLED') {
        updateQuery = `
          UPDATE ${TABLES.PAYMENTS} 
          SET status = $1, cancelled_by = $2, cancelled_at = NOW(), updated_at = NOW()
          WHERE payment_id = $3
          RETURNING *
        `;
        params = [status, userId, paymentId];
      } else {
        updateQuery = `
          UPDATE ${TABLES.PAYMENTS} 
          SET status = $1, updated_at = NOW()
          WHERE payment_id = $2
          RETURNING *
        `;
        params = [status, paymentId];
      }
    } else {
      updateQuery = `
        UPDATE ${TABLES.PAYMENTS} 
        SET status = $1, updated_at = NOW()
        WHERE payment_id = $2
        RETURNING *
      `;
      params = [status, paymentId];
    }
    
    const updateResult = await executeQuery(updateQuery, params);
    
    const updatedPayment = updateResult.rows[0];
    
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
    const result = await executeQuery(`SELECT id FROM ${TABLES.PAYMENTS} WHERE reference_id = $1 AND status = 'PAID'`, [landTitleId]);
    return result.rows.length > 0;
  }

  async getPaymentByPaymentId(paymentId) {
    const result = await executeQuery(`SELECT * FROM ${TABLES.PAYMENTS} WHERE payment_id = $1`, [paymentId]);
    return result.rows[0];
  }
  
  async rollbackPaymentByTitle(titleNumber) {
    const result = await executeQuery(`
      UPDATE ${TABLES.PAYMENTS} 
      SET status = 'PENDING', confirmed_by = NULL, confirmed_at = NULL, updated_at = NOW()
      WHERE reference_id = $1 AND status = 'PAID'
      RETURNING *
    `, [titleNumber]);
    
    if (result.rows.length > 0) {
      console.log(`🔄 Payment rollback: ${result.rows[0].payment_id} reverted to PENDING`);
      return result.rows[0];
    } else {
      console.log(`⚠️ No PAID payment found for title: ${titleNumber}`);
      return null;
    }
  }
  
  async getExistingPendingPayment(landTitleId) {
    const result = await executeQuery(`SELECT * FROM ${TABLES.PAYMENTS} WHERE reference_id = $1 AND status = 'PENDING'`, [landTitleId]);
    return result.rows[0] || null;
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;