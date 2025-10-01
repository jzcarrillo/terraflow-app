const landTitleService = require('../services/landTitleService');

const processLandTitleCreation = async (messageData) => {
  const { transaction_id, land_title_data, attachments, user_id } = messageData;
  
  try {
    
// VALIDATE REQUIRED FIELDS
    landTitleService.validateRequiredFields(land_title_data);
    
// CHECK IF TITLE EXISTS
    const exists = await landTitleService.checkTitleExists(land_title_data.title_number);
    if (exists) {
      throw new Error(`Title number ${land_title_data.title_number} already exists in database`);
    }

// CREATE LAND TITLE WITH PENDING STATUS
    const result = await landTitleService.createLandTitle({
      ...land_title_data,
      transaction_id: transaction_id,
      status: 'PENDING',
      created_by: user_id
    });
    
// PUBLISH DOCUMENT PROCESSING EVENT 
    const EventPublisher = require('../utils/eventPublisher');
    await EventPublisher.publishDocumentUpload({
      transaction_id: transaction_id,
      land_title_id: result.id,
      attachments: attachments,
      user_id: user_id
    });  
    
    return result;

  } catch (error) {
    console.error(`❌ Land title processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processLandTitleCreation
};