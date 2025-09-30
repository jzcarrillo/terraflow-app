const landTitleService = require('../services/landTitleService');

const processLandTitleCreation = async (messageData) => {
  const { transaction_id, land_title_data, attachments, user_id } = messageData;
  
  try {
    console.log(`📋 Processing land title: ${transaction_id}`);
    
// VALIDATE REQUIRED FIELDS
    landTitleService.validateRequiredFields(land_title_data);
    
// CHECK IF TITLE EXISTS
    const exists = await landTitleService.checkTitleExists(land_title_data.title_number);
    if (exists) {
      throw new Error(`Title number ${land_title_data.title_number} already exists in database`);
    }

// CREATE LAND TITLE WITH PENDING_DOCUMENTS STATUS
    const result = await landTitleService.createLandTitle({
      ...land_title_data,
      transaction_id: transaction_id,
      status: 'PENDING_DOCUMENTS',
      created_by: user_id
    });
    
    console.log('💾 Land title data inserted to database successfully');
    console.log(`✅ Land title created: ${result.id} (status: PENDING_DOCUMENTS)`);
    
    // Publish document processing event (separate from land title creation)
    await publishDocumentProcessingEvent({
      transaction_id: transaction_id,
      land_title_id: result.id,
      attachments: attachments,
      user_id: user_id
    });
    
    console.log(`📤 Document processing event published for: ${result.id}`);
    
    return result;

  } catch (error) {
    console.error(`❌ Land title processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

// Helper function to publish document processing event
const publishDocumentProcessingEvent = async (data) => {
  const rabbitmqService = require('../services/rabbitmqService');
  const { QUEUES, EVENT_TYPES } = require('../config/constants');
  
  const eventPayload = {
    event_type: EVENT_TYPES.DOCUMENT_UPLOAD,
    ...data
  };
  
  // Use existing documents queue
  await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, eventPayload);
};

module.exports = {
  processLandTitleCreation
};