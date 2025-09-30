const landTitleService = require('../services/landTitleService');

const processDocumentCompleted = async (messageData) => {
  const { transaction_id, land_title_id, uploaded_documents, total_documents } = messageData;
  
  try {
    console.log(`🎉 Documents completed for land title: ${land_title_id}`);
    console.log(`📊 Total documents uploaded: ${total_documents}`);
    
    // ACTIVATE LAND TITLE (PENDING_DOCUMENTS → ACTIVE)
    await landTitleService.activateLandTitle(land_title_id);
    
    console.log(`✅ [COMPLETION] Land title activated: ${land_title_id}`);
    
    // PUBLISH FINAL SUCCESS EVENT FOR NOTIFICATIONS
    await publishTransactionSuccess({
      transaction_id: transaction_id,
      land_title_id: land_title_id,
      document_count: total_documents,
      status: 'COMPLETED'
    });
    
  } catch (error) {
    console.error(`❌ Land title activation failed: ${transaction_id}`, error);
  }
};

const processDocumentFailed = async (messageData) => {
  const { transaction_id, land_title_id, error } = messageData;
  
  try {
    console.log(`🔄 Rolling back land title: ${land_title_id}`);
    
  // DELETE LAND TITLE (ROLLBACK)
    await landTitleService.deleteLandTitle(land_title_id);
    
    console.log(`❌ Land title rolled back: ${land_title_id}`);
    
    // PUBLISH ROLLBACK COMPLETION
    await publishTransactionFailed({
      transaction_id: transaction_id,
      service: 'document-service',
      error: error,
      rollback_completed: true
    });
    
  } catch (rollbackError) {
    console.error(`🚨 Rollback failed: ${transaction_id}`, rollbackError);
  }
};

const publishTransactionSuccess = async (data) => {
  const rabbitmqService = require('../services/rabbitmqService');
  await rabbitmqService.publishToQueue('queue_transaction_success', data);
};

const publishTransactionFailed = async (data) => {
  const rabbitmqService = require('../services/rabbitmqService');
  await rabbitmqService.publishToQueue('queue_transaction_failed', data);
};

module.exports = {
  processDocumentCompleted,
  processDocumentFailed
};