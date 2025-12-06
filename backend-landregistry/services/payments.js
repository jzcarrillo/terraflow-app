const { pool } = require('../config/db');
const { STATUS, QUEUES } = require('../config/constants');
const rabbitmq = require('../utils/rabbitmq');
const blockchainClient = require('./blockchain-client');
const transactionManager = require('./transaction-manager');

// Fix pool.connect issue
const getDbClient = async () => {
  if (typeof pool.connect !== 'function') {
    throw new Error('Database pool not properly initialized');
  }
  return await pool.connect();
};

const createPayment = async (paymentData) => {
  return await transactionManager.executeWithTransaction([
    async (client) => {
      const result = await client.query(
        'INSERT INTO payments (title_number, amount, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING payment_id',
        [paymentData.title_number, paymentData.amount, 'PENDING']
      );
      console.log(`💳 Payment created: ${result.rows[0].payment_id}`);
      return result.rows[0];
    }
  ]);
};

const confirmPayment = async (paymentId) => {
  // Update payment status only
  const [payment] = await transactionManager.executeWithTransaction([
    async (client) => {
      const result = await client.query(
        'UPDATE payments SET status = $1, paid_at = NOW() WHERE payment_id = $2 RETURNING *',
        ['PAID', paymentId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      console.log(`✅ Payment confirmed: ${paymentId}`);
      return result.rows[0];
    }
  ]);
  
  // Send RabbitMQ message to Land Registry Service
  const message = {
    event_type: 'PAYMENT_CONFIRMED',
    payment_id: paymentId,
    title_number: payment.title_number,
    reference_type: 'LAND_TITLE',
    timestamp: new Date().toISOString()
  };
  
  await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, message);
  console.log(`📨 Payment confirmation message sent for title: ${payment.title_number}`);
  
  return payment;
};

const paymentStatusUpdate = async (messageData) => {
  const { reference_id, status } = messageData;
  
  try {
    console.log(`🔄 New status: ${status}`);
    
// GET CURRENT STATUS BEFORE UPDATE
    const getCurrentQuery = `SELECT * FROM land_titles WHERE title_number = $1`;
    const currentResult = await pool.query(getCurrentQuery, [reference_id]);
    
    if (currentResult.rows.length === 0) {
      throw new Error(`Land title not found: ${reference_id}`);
    }
    
    const currentLandTitle = currentResult.rows[0];
    const oldStatus = currentLandTitle.status;
    
    console.log(`🔄 Status transition: ${oldStatus} → ${status}`);
    
// UPDATE LAND TITLE STATUS WITH TRANSACTION
    const [result] = await transactionManager.executeWithTransaction([
      async (client) => {
        const updateResult = await client.query(
          'UPDATE land_titles SET status = $1, updated_at = NOW() WHERE title_number = $2 RETURNING *',
          [status, reference_id]
        );
        return updateResult;
      }
    ]);
    
    if (result.rows.length > 0) {
      const landTitle = result.rows[0];
      console.log(`✅ Land title ${landTitle.title_number} status updated to ${status} successfully`);
      
      // Process blockchain recording after successful database transaction
      await processBlockchainRecording(landTitle, status, oldStatus, currentLandTitle, reference_id);
      
      return landTitle;
    } else {
      console.log(`⚠️ No land title found for reference: ${reference_id}`);
      
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

const processBlockchainRecording = async (landTitle, status, oldStatus, currentLandTitle, reference_id) => {
  try {
    if (status === 'ACTIVE') {
        // CHECK IF THIS IS A REACTIVATION (previously cancelled)
        if (currentLandTitle.cancellation_hash) {
          // REACTIVATION - Record reactivation transaction
          try {
            console.log(`🔄 Recording reactivation for ${landTitle.title_number} on blockchain`);
            
            const reactivationPayload = {
              title_number: landTitle.title_number,
              previous_status: oldStatus,
              new_status: status,
              original_hash: currentLandTitle.blockchain_hash,
              cancellation_hash: currentLandTitle.cancellation_hash,
              reason: 'Payment completed after cancellation - land title reactivated',
              timestamp: Math.floor(Date.now() / 1000),
              transaction_id: currentLandTitle.transaction_id
            };
            
            console.log(`🔍 DEBUG - Reactivation payload:`, reactivationPayload);
            
            const reactivationResponse = await blockchainClient.recordReactivation(reactivationPayload);
            
            console.log(`🔍 DEBUG - Reactivation response:`, reactivationResponse);
            
            if (reactivationResponse.success) {
              console.log(`🔄 Reactivation TX: ${reactivationResponse.transaction_id}`);
              console.log(`🔄 Reactivation Hash: ${reactivationResponse.blockchainHash}`);
              
              // UPDATE LAND TITLE WITH REACTIVATION HASH
              const reactivationHash = reactivationResponse.blockchainHash;
              
              if (reactivationHash) {
                await pool.query(
                  'UPDATE land_titles SET reactivation_hash = $1, reactivated_at = NOW(), reactivation_reason = $2 WHERE title_number = $3',
                  [reactivationHash, 'Payment completed after cancellation - land title reactivated', reference_id]
                );
                console.log(`✅ Reactivation hash stored: ${reactivationHash}`);
              }
            }
            
          } catch (reactivationError) {
            console.error('❌ Reactivation blockchain recording failed:', reactivationError.message);
            
            // Rollback land title to PENDING
            await pool.query(
              'UPDATE land_titles SET status = $1 WHERE title_number = $2',
              ['PENDING', reference_id]
            );
            console.log(`🔄 Reactivation rollback: ${reference_id} reverted to PENDING`);
            
            // Send rollback event to Payment Service
            const rollbackMessage = {
              event_type: 'PAYMENT_ROLLBACK_REQUIRED',
              title_number: reference_id,
              reason: 'Blockchain reactivation failed',
              timestamp: new Date().toISOString()
            };
            
            await rabbitmq.publishToQueue(QUEUES.PAYMENTS, rollbackMessage);
            console.log(`📨 Rollback event sent to Payment Service for title: ${reference_id}`);
          }
        } else {
          // FIRST TIME ACTIVATION - Normal blockchain recording
          try {
            console.log(`🔗 Recording land title ${landTitle.title_number} to blockchain (first activation)`);
            
            // Validate land title data exists
            if (!landTitle || !landTitle.title_number) {
              throw new Error(`Invalid land title data for reference: ${reference_id}`);
            }
            
            const blockchainPayload = {
              title_number: landTitle.title_number,
              owner_name: landTitle.owner_name,
              property_location: landTitle.property_location,
              status: status,
              reference_id: reference_id,
              timestamp: Math.floor(new Date(landTitle.created_at).getTime() / 1000),
              transaction_id: landTitle.transaction_id
            };
            
            const blockchainResponse = await blockchainClient.recordLandTitle(blockchainPayload);
            
            if (blockchainResponse.success) {
              console.log(`🔗 Blockchain TX: ${blockchainResponse.transaction_id}`);
              console.log(`🔗 Hash: ${blockchainResponse.blockchainHash}`);
              
              const blockchainHash = blockchainResponse.blockchainHash;
              
              if (blockchainHash) {
                await pool.query(
                  'UPDATE land_titles SET blockchain_hash = $1 WHERE title_number = $2',
                  [blockchainHash, reference_id]
                );
                console.log(`✅ Blockchain hash stored: ${blockchainHash}`);
              }
            } else {
              throw new Error(`Blockchain recording failed: ${blockchainResponse.message}`);
            }
          
          } catch (blockchainError) {
            console.error('❌ Blockchain integration failed:', blockchainError.message);
            
            // Rollback land title to PENDING
            await pool.query(
              'UPDATE land_titles SET status = $1 WHERE title_number = $2',
              ['PENDING', reference_id]
            );
            console.log(`🔄 Land title rollback: ${reference_id} reverted to PENDING`);
            
            // Send rollback event to Payment Service
            const rollbackMessage = {
              event_type: 'PAYMENT_ROLLBACK_REQUIRED',
              title_number: reference_id,
              reason: 'Blockchain recording failed',
              timestamp: new Date().toISOString()
            };
            
            await rabbitmq.publishToQueue(QUEUES.PAYMENTS, rollbackMessage);
            console.log(`📨 Rollback event sent to Payment Service for title: ${reference_id}`);
          }
        }
        
      // PUBLISH SUCCESS EVENT FOR ACTIVATION
      const successEvent = {
        event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
        reference_id: reference_id,
        land_title_id: landTitle.id,
        title_number: landTitle.title_number,
        new_status: status,
        timestamp: new Date().toISOString()
      };
      
      await rabbitmq.publishToQueue(QUEUES.PAYMENTS, successEvent);
    } else if (status === 'PENDING' && oldStatus === 'ACTIVE') {
      // RECORD CANCELLATION ON BLOCKCHAIN (ACTIVE → PENDING means payment cancelled)
      try {
        console.log(`❌ Recording cancellation for ${landTitle.title_number} on blockchain (${oldStatus} → ${status})`);
        
        const cancellationPayload = {
          title_number: landTitle.title_number,
          previous_status: oldStatus,
          new_status: status,
          original_hash: currentLandTitle.blockchain_hash,
          reason: 'Payment cancelled - reverted to pending status',
          timestamp: Math.floor(Date.now() / 1000),
          transaction_id: currentLandTitle.transaction_id
        };
        
        console.log(`🔍 DEBUG - Cancellation payload:`, cancellationPayload);
        
        const cancellationResponse = await blockchainClient.recordCancellation(cancellationPayload);
        
        console.log(`🔍 DEBUG - Cancellation response:`, cancellationResponse);
        
        if (cancellationResponse.success) {
          console.log(`❌ Cancellation TX: ${cancellationResponse.transaction_id}`);
          console.log(`❌ Cancellation Hash: ${cancellationResponse.blockchainHash}`);
          
          const cancellationHash = cancellationResponse.blockchainHash;
          
          if (cancellationHash) {
            await pool.query(
              'UPDATE land_titles SET cancellation_hash = $1, cancelled_at = NOW(), cancellation_reason = $2 WHERE title_number = $3',
              [cancellationHash, 'Payment cancelled - reverted to pending status', reference_id]
            );
            console.log(`✅ Cancellation hash stored: ${cancellationHash}`);
          }
        }
        
      } catch (cancellationError) {
        console.error('❌ Cancellation blockchain recording failed:', cancellationError.message);
      }
      
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
    
  } catch (blockchainError) {
    console.error('❌ Blockchain processing failed:', blockchainError.message);
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  paymentStatusUpdate
};