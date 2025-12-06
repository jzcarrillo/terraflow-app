const { pool } = require('../config/db');

class TransactionManager {
  async executeWithTransaction(operations) {
    if (!pool || typeof pool.connect !== 'function') {
      throw new Error('Database pool not properly initialized');
    }
    
    const client = await pool.connect();
    
    try {
      console.log('🔄 BEGIN TRANSACTION');
      await client.query('BEGIN');
      
      const results = [];
      for (const operation of operations) {
        const result = await operation(client);
        results.push(result);
      }
      
      console.log('✅ COMMIT TRANSACTION');
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      console.log('❌ ROLLBACK TRANSACTION:', error.message);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async executeWithSaga(steps) {
    const compensations = [];
    
    try {
      for (const step of steps) {
        const result = await step.execute();
        if (step.compensate) {
          compensations.push(step.compensate);
        }
      }
    } catch (error) {
      console.log('🔄 EXECUTING COMPENSATIONS');
      for (const compensate of compensations.reverse()) {
        try {
          await compensate();
        } catch (compError) {
          console.error('❌ Compensation failed:', compError.message);
        }
      }
      throw error;
    }
  }
}

module.exports = new TransactionManager();