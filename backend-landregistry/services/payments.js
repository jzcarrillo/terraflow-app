const { pool } = require('../config/db');
const { STATUS, QUEUES } = require('../config/constants');
const rabbitmq = require('../utils/rabbitmq');
const blockchainClient = require('./blockchain-client');

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
      
      if (status === 'ACTIVE') {
        // RECORD ON BLOCKCHAIN
        try {
          console.log(`🔗 Recording land title ${landTitle.title_number} to blockchain`);
          
          const blockchainResponse = await blockchainClient.recordLandTitle({
            title_number: landTitle.title_number,
            owner_name: landTitle.owner_name,
            property_location: landTitle.property_location,
            status: status,
            reference_id: reference_id,
            timestamp: landTitle.created_at,
            transaction_id: landTitle.transaction_id
          });
          
          if (blockchainResponse.success) {
            console.log(`🔗 Blockchain TX: ${blockchainResponse.transaction_id}`);
            console.log(`📦 Block: ${blockchainResponse.block_number}`);
            
            // PUBLISH SUCCESS EVENT BACK TO PAYMENTS
            const successEvent = {
              event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
              reference_id: reference_id,
              land_title_id: landTitle.id,
              title_number: landTitle.title_number,
              new_status: status,
              blockchain_tx: blockchainResponse.transaction_id,
              blockchain_hash: blockchainResponse.blockchain_hash,
              timestamp: new Date().toISOString()
            };
            
            await rabbitmq.publishToQueue(QUEUES.PAYMENTS, successEvent);
          } else {
            throw new Error(`Blockchain recording failed: ${blockchainResponse.message}`);
          }
          
        } catch (blockchainError) {
          console.error('❌ Blockchain integration failed:', blockchainError.message);
          
          // PUBLISH SUCCESS WITHOUT BLOCKCHAIN (fallback)
          const successEvent = {
            event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
            reference_id: reference_id,
            land_title_id: landTitle.id,
            title_number: landTitle.title_number,
            new_status: status,
            blockchain_status: 'FAILED',
            error: blockchainError.message,
            timestamp: new Date().toISOString()
          };
          
          await rabbitmq.publishToQueue(QUEUES.PAYMENTS, successEvent);
        }
      } else {
        // For non-ACTIVE status, just publish success without blockchain
        const successEvent = {
          event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
          reference_id: reference_id,
          land_title_id: landTitle.id,
          title_number: landTitle.title_number,
          new_status: status,
          timestamp: new Date().toISOString()
        };
        
        await rabbitmq.publishToQueue(QUEUES.PAYMENTS, successEvent);
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
      
      await rabbitmq.publishToQueue(QUEUES.PAYMENTS, failureEvent);
      
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
      
      await rabbitmq.publishToQueue(QUEUES.PAYMENTS, failureEvent);
    } catch (publishError) {
      console.error('❌ Failed to publish failure event:', publishError.message);
    }
    
    throw error;
  }
};

module.exports = {
  paymentStatusUpdate
};