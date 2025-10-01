const fs = require('fs').promises;
const path = require('path');
const documentService = require('../services/documentService');
const rabbitmqService = require('../services/rabbitmqService');
const { EVENT_TYPES, QUEUES } = require('../config/constants');

// UPLOAD DOCUMENTS
const processDocumentUpload = async (messageData) => {
  const { transaction_id, land_title_id, attachments, user_id } = messageData;
  
  try {
    console.log(`📨 Received document upload request:`);
    console.log(`  Transaction ID: ${transaction_id}`);
    console.log(`  Land Title ID: ${land_title_id}`);
    console.log(`  Documents: ${attachments.length}`);
    attachments.forEach((attachment, index) => {
      console.log(`    ${index + 1}. ${attachment.original_name} (${attachment.mime_type}, ${attachment.size} bytes)`);
    });
    
    const uploadedDocuments = [];
    
// PROCESS ALL DOCUMENTS
    for (const [index, attachment] of attachments.entries()) {
      
// CONVERT BASE64 BACK TO BUFFER
      const fileBuffer = Buffer.from(attachment.buffer, 'base64');
      
// GENERATE UNIQUE FILENAME
      const fileName = `${land_title_id}_${attachment.document_type}_${Date.now()}_${index}.${getFileExtension(attachment.original_name)}`;
      const filePath = path.join('./uploads', fileName);
      
// SAVE FILE TO DISK
      await fs.writeFile(filePath, fileBuffer);
      
// SAVE DOCUMENT RECORD
      const document = await documentService.createDocument({
        land_title_id: land_title_id,
        transaction_id: transaction_id,
        document_type: attachment.document_type,
        file_name: attachment.original_name,
        file_path: filePath,
        file_size: attachment.size,
        mime_type: attachment.mime_type,
        uploaded_by: user_id,
        status: 'PENDING'
      });
      
      uploadedDocuments.push(document);
    }
    
    console.log(`✅ ${uploadedDocuments.length} documents processed successfully`);
    
// PUBLISH DOCUMENTS UPLOADED EVENT TO BACKEND-LANDREGISTRY
    await rabbitmqService.publishToQueue(QUEUES.LAND_REGISTRY, {
      event_type: EVENT_TYPES.DOCUMENT_UPLOADED,
      transaction_id,
      land_title_id,
      uploaded_documents: uploadedDocuments,
      total_documents: uploadedDocuments.length
    });
    console.log(`📤 Message published to queue_landregistry`);
    
  } catch (error) {
    console.error(`❌ [DOCUMENT] Upload failed: ${transaction_id}`, error);
    
    // Cleanup uploaded files on failure
    await cleanupFiles(uploadedDocuments);
    
    // Publish failure event to backend-landregistry
    await rabbitmqService.publishToQueue(QUEUES.LAND_REGISTRY, {
      event_type: EVENT_TYPES.DOCUMENT_FAILED,
      transaction_id,
      land_title_id,
      error: error.message
    });
  }
};

const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

// REUSABLE FILE CLEANUP UTILITY
const cleanupFiles = async (documents) => {
  for (const doc of documents) {
    try {
      await fs.unlink(doc.file_path);
      console.log(`🗑️ File deleted: ${doc.file_path}`);
    } catch (error) {
      console.error(`Failed to delete file: ${doc.file_path}`, error);
    }
  }
};

const processLandTitlePaid = async (messageData) => {
  const { land_title_id, transaction_id } = messageData;
  
  try {
    console.log(`💰 [PAYMENT] Activating documents for land title: ${land_title_id}`);
    
    // Update all documents for this land title to ACTIVE
    const result = await documentService.updateDocumentStatusByLandTitle(land_title_id, 'ACTIVE');
    
    console.log(`✅ [PAYMENT] ${result.rowCount} documents activated for land title: ${land_title_id}`);
    
  } catch (error) {
    console.error(`❌ [PAYMENT] Failed to activate documents for land title: ${land_title_id}`, error);
  }
};

const processRollbackTransaction = async (messageData) => {
  const { transaction_id, land_title_id, reason } = messageData;
  
  try {
    console.log(`🔄 [ROLLBACK] Rolling back documents for transaction: ${transaction_id}`);
    
    // DELETE ALL DOCUMENTS FOR THIS TRANSACTION
    const deletedDocuments = await documentService.deleteDocumentsByTransactionId(transaction_id);
    
    // CLEANUP FILES FROM DISK
    await cleanupFiles(deletedDocuments);
    
    console.log(`✅ [ROLLBACK] ${deletedDocuments.length} documents rolled back for transaction: ${transaction_id}`);
    
  } catch (error) {
    console.error(`❌ [ROLLBACK] Failed to rollback documents: ${transaction_id}`, error);
  }
};

module.exports = {
  processDocumentUpload,
  processLandTitlePaid,
  processRollbackTransaction
};