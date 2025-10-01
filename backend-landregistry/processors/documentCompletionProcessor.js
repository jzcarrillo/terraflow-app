const landTitleService = require('../services/landTitleService');

const processDocumentUploaded = async (messageData) => {
  const { transaction_id, land_title_id, uploaded_documents, total_documents } = messageData;
  
  try {
    // DOCUMENTS UPLOADED, KEEP STATUS AS PENDING (waiting for payment)
    // Just acknowledge completion, no status change needed
    
  } catch (error) {
    console.error(`❌ Failed to process document completion: ${transaction_id}`, error);
  }
};

const processDocumentFailed = async (messageData) => {
  const { transaction_id, land_title_id, error } = messageData;
  
  try {
    console.log(`🔄 Rolling back land title: ${land_title_id}`);
    
    // DELETE LAND TITLE (ROLLBACK)
    await landTitleService.deleteLandTitle(land_title_id);
    
    console.log(`❌ Land title rolled back: ${land_title_id}`);
    
    // PUBLISH ROLLBACK EVENT TO DOCUMENTS SERVICE
    const EventPublisher = require('../utils/eventPublisher');
    
    await EventPublisher.publishRollback({
      transaction_id,
      land_title_id,
      reason: 'document_upload_failed'
    });
    
    console.log(`📤 Rollback event sent to documents service: ${transaction_id}`);
    
  } catch (rollbackError) {
    console.error(`🚨 Rollback failed: ${transaction_id}`, rollbackError);
  }
};

module.exports = {
  processDocumentUploaded,
  processDocumentFailed
};