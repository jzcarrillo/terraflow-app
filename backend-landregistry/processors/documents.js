const documents = require('../services/documents');

const processDocumentUploaded = async (messageData) => {
  try {
    await documents.processDocumentUploaded(messageData);
  } catch (error) {
    console.error(`❌ Failed to process document completion: ${messageData.transaction_id}`, error);
  }
};

module.exports = {
  processDocumentUploaded
};