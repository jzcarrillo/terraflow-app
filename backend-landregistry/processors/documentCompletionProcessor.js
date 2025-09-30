const landTitleService = require('../services/landTitleService');

const processDocumentUploaded = async (messageData) => {
  const { transaction_id, land_title_id, uploaded_documents, total_documents } = messageData;
  
  try {
    console.log(`📎 Documents uploaded for land title: ${land_title_id}`);
    console.log(`📊 Total documents uploaded: ${total_documents}`);
    
    // UPDATE LAND TITLE STATUS TO DOCUMENT_UPLOADED
    const { STATUS } = require('../config/constants');
    await landTitleService.updateLandTitleStatus(land_title_id, STATUS.DOCUMENT_UPLOADED);
    
    console.log(`✅ Land title status updated to DOCUMENT_UPLOADED: ${land_title_id}`);
    
  } catch (error) {
    console.error(`❌ Failed to update land title status: ${transaction_id}`, error);
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