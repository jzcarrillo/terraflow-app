const landTitleService = require('../services/landTitleService');

const processLandTitleCreation = async (messageData) => {
  try {
    landTitleService.validateRequiredFields(messageData);
    
    const exists = await landTitleService.checkTitleExists(messageData.title_number);
    if (exists) {
      throw new Error(`Title number ${messageData.title_number} already exists in database`);
    }

    const result = await landTitleService.createLandTitle(messageData);
    console.log('💾 Data inserted to database successfully');
    return result;

  } catch (error) {
    console.error('❌ Land title processing failed:', error.message);
    throw error;
  }
};

module.exports = {
  processLandTitleCreation
};