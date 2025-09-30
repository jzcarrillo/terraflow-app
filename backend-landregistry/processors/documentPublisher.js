const landTitleService = require('../services/landTitleService');

const processDocumentPublishing = async (messageData) => {
  const { transaction_id, land_title_id, attachments, user_id } = messageData;
  
  try {
    console.log(`📤 Processing document publishing for land title: ${land_title_id}`);
    
    // Verify land title exists and is in correct status
    const landTitle = await landTitleService.getLandTitleById(land_title_id);
    if (!landTitle) {
      throw new Error(`Land title not found: ${land_title_id}`);
    }
    
    if (landTitle.status !== 'PENDING_DOCUMENTS') {
      throw new Error(`Invalid land title status: ${landTitle.status}. Expected: PENDING_DOCUMENTS`);
    }
    
    // Publish document upload event
    if (attachments && attachments.length > 0) {
      await publishDocumentUploadEvent({
        transaction_id: transaction_id,
        land_title_id: land_title_id,
        attachments: attachments,
        user_id: user_id
      });
      
      console.log(`✅ Document upload event published for: ${land_title_id} (${attachments.length} documents)`);
    } else {
      // No documents, set to PENDING_PAYMENT directly
      await landTitleService.updateStatusToPendingPayment(land_title_id);
      console.log(`💰 Land title set to PENDING_PAYMENT (no documents): ${land_title_id}`);
    }
    
  } catch (error) {
    console.error(`❌ Document publishing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

// Helper function to publish document upload event
const publishDocumentUploadEvent = async (data) => {
  const rabbitmqService = require('../services/rabbitmqService');
  const { QUEUES, EVENT_TYPES } = require('../config/constants');
  
  const eventPayload = {
    event_type: EVENT_TYPES.DOCUMENT_UPLOAD,
    ...data
  };
  
  await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, eventPayload);
};

module.exports = {
  processDocumentPublishing
};