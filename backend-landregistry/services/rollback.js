const { pool } = require('../config/db');
const rabbitmq = require('../utils/rabbitmq');
const { STATUS, QUEUES, EVENT_TYPES } = require('../config/constants');

async function processDocumentFailed(messageData) {
  const { transaction_id, land_title_id } = messageData;
  
  try {
    console.log(`❌ Document upload failed for land title: ${land_title_id}`);
    
    // DELETE LAND TITLE FROM DATABASE (COMPLETE ROLLBACK)
    await pool.query(`DELETE FROM land_titles WHERE id = $1`, [land_title_id]);
    console.log(`🗑️ Land title ${land_title_id} deleted from database`);
    
    // PUBLISH ROLLBACK EVENT TO DOCUMENTS SERVICE
    await rabbitmq.publishToQueue(QUEUES.DOCUMENTS, {
      event_type: EVENT_TYPES.ROLLBACK_TRANSACTION,
      transaction_id,
      land_title_id,
      reason: 'document_upload_failed'
    });
    
    console.log(`🔄 Rollback event sent to document service for transaction: ${transaction_id}`);
    
  } catch (error) {
    console.error(`❌ Failed to process document failure:`, error.message);
    throw error;
  }
}

async function processRollbackTransaction(messageData) {
  const { land_title_id, reason } = messageData;
  
  try {
    console.log(`🔄 Processing rollback for land title: ${land_title_id}`);
    
    // DELETE land title from database
    const query = `
      DELETE FROM land_titles 
      WHERE id = $1
    `;
    
    await pool.query(query, [land_title_id]);
    
    console.log(`🗑️ Land title ${land_title_id} deleted from database`);
    console.log(`📝 Rollback reason: ${reason}`);
    
  } catch (error) {
    console.error(`❌ Rollback failed for land title ${land_title_id}:`, error.message);
    throw error;
  }
}

module.exports = {
  processDocumentFailed,
  processRollbackTransaction
};