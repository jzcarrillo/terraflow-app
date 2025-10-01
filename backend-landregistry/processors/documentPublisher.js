const landTitleService = require('../services/landTitleService');

const processDocumentPublishing = async (messageData) => {
  const { transaction_id, land_title_id, attachments, user_id } = messageData;
  
  try {
    console.log(`📤 Processing document publishing for land title: ${land_title_id}`);
    
// VERIFY LAND TITLE EXISTS AND IS IN CORRECT STATUS
    const landTitle = await landTitleService.getLandTitleById(land_title_id);
    if (!landTitle) {
      throw new Error(`Land title not found: ${land_title_id}`);
    }
    
    if (landTitle.status !== 'PENDING') {
      throw new Error(`Invalid land title status: ${landTitle.status}. Expected: PENDING`);
    }
    
// PUBLISH DOCUMENT UPLOAD EVENT
    if (attachments && attachments.length > 0) {
      const EventPublisher = require('../utils/eventPublisher');
      await EventPublisher.publishDocumentUpload({
        transaction_id: transaction_id,
        land_title_id: land_title_id,
        attachments: attachments,
        user_id: user_id
      });
      
      console.log(`✅ Document upload event published for: ${land_title_id} (${attachments.length} documents)`);
    } else {

// NO DOCUMENTS, KEEP AS PENDING
      console.log(`💰 Land title remains PENDING (no documents): ${land_title_id}`);
    }
    
  } catch (error) {
    console.error(`❌ Document publishing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processDocumentPublishing
};