const landtitle = require('../services/landtitle');

const processLandTitleCreation = async (messageData) => {
  const { transaction_id } = messageData;
  
  try {
    const result = await landtitle.landTitleCreation(messageData);
    return result;
  } catch (error) {
    console.error(`❌ Land title processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processLandTitleCreation
};