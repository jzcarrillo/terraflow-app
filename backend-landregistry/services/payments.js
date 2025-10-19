const { pool } = require('../config/db');
const { STATUS, QUEUES } = require('../config/constants');
const publisher = require('./publisher');

const paymentStatusUpdate = async (messageData) => {
  const { reference_id, status } = messageData;
  
  try {
    console.log(`🔄 New status: ${status}`);
    
// UPDATE LAND TITLE STATUS TO ACTIVE WHEN PAYMENT IS PAID
    const query = `
      UPDATE land_titles 
      SET status = $1, updated_at = NOW()
      WHERE title_number = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, reference_id]);
    
    if (result.rows.length > 0) {
      const landTitle = result.rows[0];
      console.log(`✅ Land title ${landTitle.title_number} status updated to ${status} successfully`);
      
// PUBLISH SUCCESS EVENT BACK TO PAYMENTS
      const successEvent = {
        event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
        reference_id: reference_id,
        land_title_id: landTitle.id,
        title_number: landTitle.title_number,
        new_status: status,
        timestamp: new Date().toISOString()
      };
      
      await publisher.publishToQueue(QUEUES.PAYMENTS, successEvent);
      console.log('📤 Success event published to queue_payments');
      
      // PUBLISH EVENT TO DOCUMENT SERVICE WHEN LAND TITLE BECOMES ACTIVE
      if (status === STATUS.ACTIVE) {
        const documentEvent = {
          event_type: 'LAND_TITLE_ACTIVATED',
          land_title_id: landTitle.id,
          title_number: landTitle.title_number,
          reference_id: reference_id,
          timestamp: new Date().toISOString()
        };
        
        await publisher.publishToQueue(QUEUES.DOCUMENTS, documentEvent);
        console.log('📤 LAND_TITLE_ACTIVATED event published to queue_documents');
      }
      
      return landTitle;
    } else {
      console.log(`⚠️ No land title found for reference: ${reference_id}`);
      
// PUBLISH FAILURE EVENT BACK TO PAYMENTS
      const failureEvent = {
        event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED',
        reference_id: reference_id,
        error: 'Land title not found',
        timestamp: new Date().toISOString()
      };
      
      await publisher.publishToQueue(QUEUES.PAYMENTS, failureEvent);
      console.log('📤 Failure event published to payments queue');
      
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Payment status update failed:`, error.message);
    
// PUBLISH FAILURE EVENT BACK TO PAYMENTS
    try {
      const failureEvent = {
        event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED',
        reference_id: reference_id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      await publisher.publishToQueue(QUEUES.PAYMENTS, failureEvent);
      console.log('📤 Failure event published to payments queue');
    } catch (publishError) {
      console.error('❌ Failed to publish failure event:', publishError.message);
    }
    
    throw error;
  }
};

module.exports = {
  paymentStatusUpdate
};