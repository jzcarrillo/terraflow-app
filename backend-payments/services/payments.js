const { pool } = require('../config/db');
const { TABLES, STATUS } = require('../config/constants');
const publisher = require('./publisher');

class PaymentService {

  async getAllPayments() {
    const result = await pool.query(`SELECT * FROM ${TABLES.PAYMENTS} ORDER BY created_at DESC`);
    return result.rows;
  }

  async getPaymentById(id) {
    const result = await pool.query(`SELECT * FROM ${TABLES.PAYMENTS} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async createPayment(data) {
    const { 
      payment_id, reference_type, reference_id, amount, payer_name, 
      payment_method = 'CASH', status = STATUS.PENDING, created_by
    } = data;

    const result = await pool.query(`
      INSERT INTO ${TABLES.PAYMENTS} (
        payment_id, reference_type, reference_id, amount, payer_name, 
        payment_method, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      payment_id, reference_type, reference_id, amount, payer_name, 
      payment_method, status, created_by
    ]);


    return result.rows[0];
  }

  async updatePayment(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    // Build dynamic query based on provided fields
    if (data.amount !== undefined) {
      updates.push(`amount = $${paramCount}`);
      values.push(data.amount);
      paramCount++;
    }
    
    if (data.payer_name !== undefined) {
      updates.push(`payer_name = $${paramCount}`);
      values.push(data.payer_name);
      paramCount++;
    }
    
    if (data.payment_method !== undefined) {
      updates.push(`payment_method = $${paramCount}`);
      values.push(data.payment_method);
      paramCount++;
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const query = `
      UPDATE ${TABLES.PAYMENTS} 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`Payment with ID ${id} not found`);
    }
    
    return result.rows[0];
  }

  async updatePaymentStatus(id, status, userId = null) {
    // Get current payment status first
    const currentPayment = await this.getPaymentById(id);
    if (!currentPayment) {
      throw new Error(`Payment with ID ${id} not found`);
    }
    
    // Check if status is already the same (idempotency check)
    if (currentPayment.status === status) {
      console.log(`⚠️ Payment ${id} is already ${status} - No event will be published`);
      return currentPayment;
    }
    
    let query, params;
    
    if (status === STATUS.PAID) {
      query = `
        UPDATE ${TABLES.PAYMENTS} 
        SET status = $1, confirmed_by = $2, confirmed_at = NOW(), updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      params = [status, userId, id];
    } else if (status === 'CANCELLED') {
      query = `
        UPDATE ${TABLES.PAYMENTS} 
        SET status = $1, cancelled_by = $2, cancelled_at = NOW(), updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      params = [status, userId, id];
    } else {
      query = `
        UPDATE ${TABLES.PAYMENTS} 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      params = [status, id];
    }
    
    const result = await pool.query(query, params);
    const updatedPayment = result.rows[0];
    
// PUBLISH EVENT TO LAND REGISTRY WHEN PAYMENT STATUS CHANGES
    if (updatedPayment) {
      if (status === STATUS.PAID) {
        console.log(`💳 Payment PAID - Publishing event to land registry for reference: ${updatedPayment.reference_id}`);
        await publisher.publishLandRegistryStatusUpdate(updatedPayment);
      } else if (status === 'CANCELLED') {
        console.log(`💳 Payment CANCELLED - Publishing revert event to land registry for reference: ${updatedPayment.reference_id}`);
        await publisher.publishLandRegistryRevertUpdate(updatedPayment);
      }
    }
    
    return updatedPayment;
  }

  async getPaymentStatus(id) {
    const result = await pool.query(`SELECT id, status, reference_id, updated_at FROM ${TABLES.PAYMENTS} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async checkPaymentExists(paymentId) {
    const result = await pool.query(`SELECT id FROM ${TABLES.PAYMENTS} WHERE payment_id = $1`, [paymentId]);
    return result.rows.length > 0;
  }

  async checkLandTitlePaymentExists(landTitleId) {
    console.log(`🔍 Checking payments table for reference_id: ${landTitleId}`);
    const result = await pool.query(`SELECT id, payment_id, reference_id, status FROM ${TABLES.PAYMENTS} WHERE reference_id = $1 AND status = 'PENDING'`, [landTitleId]);
    console.log(`📋 Found ${result.rows.length} pending payments for ${landTitleId}:`, result.rows);
    return result.rows.length > 0;
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;