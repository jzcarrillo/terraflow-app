const rabbitmq = require('../utils/rabbitmq');
const documentService = require('../services/document');
const { saveFile, deleteFile, getFileExtension } = require('../utils/fileHandler');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

const messageHandler = async (messageData) => {
  const { event_type } = messageData;
  
  switch (event_type) {
    case EVENT_TYPES.DOCUMENT_UPLOAD:
      await handleDocumentUpload(messageData);
      break;
      
    case EVENT_TYPES.LAND_TITLE_PAID:
    case EVENT_TYPES.LAND_TITLE_ACTIVATED:
      await handleDocumentActivation(messageData);
      break;
      
    case EVENT_TYPES.ROLLBACK_TRANSACTION:
      await handleRollback(messageData);
      break;
  }
};

const handleDocumentUpload = async (messageData) => {
  const { transaction_id, land_title_id, attachments, user_id } = messageData;
  const uploadedDocuments = [];
  
  console.log(`\n📄 ===== DOCUMENT UPLOAD =====`);
  console.log(`🔑 Transaction: ${transaction_id}`);
  console.log(`🏠 Land Title ID: ${land_title_id}`);
  console.log(`📎 Processing ${attachments.length} files:`);
  attachments.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.original_name}`);
  });
  
  try {
    for (const [index, attachment] of attachments.entries()) {
      const fileBuffer = Buffer.from(attachment.buffer, 'base64');
      const fileName = `${land_title_id}_${attachment.document_type}_${Date.now()}_${index}.${getFileExtension(attachment.original_name)}`;
      const filePath = await saveFile(fileBuffer, fileName);
      
      const document = await documentService.createDocument({
        land_title_id, transaction_id,
        document_type: attachment.document_type,
        file_name: attachment.original_name,
        file_path: filePath,
        file_size: attachment.size,
        mime_type: attachment.mime_type,
        uploaded_by: user_id
      });
      
      uploadedDocuments.push(document);
    }
    
    await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, {
      event_type: EVENT_TYPES.DOCUMENT_UPLOADED,
      transaction_id, land_title_id,
      uploaded_documents: uploadedDocuments,
      total_documents: uploadedDocuments.length
    });
    
    console.log(`✅ ${uploadedDocuments.length} documents uploaded successfully`);
    console.log(`📤 Confirmation sent to land registry`);
    console.log(`📄 ===== DOCUMENT UPLOAD COMPLETED =====\n`);
  } catch (error) {
    for (const doc of uploadedDocuments) {
      await deleteFile(doc.file_path);
    }
    
    await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, {
      event_type: EVENT_TYPES.DOCUMENT_FAILED,
      transaction_id, land_title_id,
      error: error.message
    });
    
    console.log(`❌ FAILED: Document upload failed - ${error.message}`);
    console.log(`📄 ===== DOCUMENT UPLOAD FAILED =====\n`);
  }
};

const handleDocumentActivation = async (messageData) => {
  const { land_title_id } = messageData;
  await documentService.updateDocumentStatusByLandTitle(land_title_id, 'ACTIVE');
};

const handleRollback = async (messageData) => {
  const { transaction_id } = messageData;
  const deletedDocuments = await documentService.deleteDocumentsByTransactionId(transaction_id);
  
  for (const doc of deletedDocuments) {
    await deleteFile(doc.file_path);
  }
};

const startConsumer = async () => {
  try {
    await rabbitmq.consume(QUEUES.DOCUMENTS, messageHandler);
  } catch (error) {
    console.error('❌ Consumer start failed:', error.message);
    setTimeout(startConsumer, 10000);
  }
};

module.exports = { startConsumer };