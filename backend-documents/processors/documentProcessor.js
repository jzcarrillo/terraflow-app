const fs = require('fs').promises;
const path = require('path');
const documentService = require('../services/documentService');
const rabbitmqService = require('../services/rabbitmqService');
const { EVENT_TYPES, QUEUES } = require('../config/constants');

const processDocumentUpload = async (messageData) => {
  const { transaction_id, land_title_id, attachments, user_id } = messageData;
  
  try {
    console.log(`📎 [DOCUMENT] Processing ${attachments.length} documents for: ${land_title_id}`);
    
    const uploadedDocuments = [];
    
    // Process all documents
    for (const [index, attachment] of attachments.entries()) {
      console.log(`📄 Processing document ${index + 1}/${attachments.length}: ${attachment.original_name}`);
      
      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(attachment.buffer, 'base64');
      
      // Generate unique filename
      const fileName = `${land_title_id}_${attachment.document_type}_${Date.now()}_${index}.${getFileExtension(attachment.original_name)}`;
      const filePath = path.join('./uploads', fileName);
      
      // Save file to disk
      await fs.writeFile(filePath, fileBuffer);
      
      // Save document record
      const document = await documentService.createDocument({
        land_title_id: land_title_id,
        transaction_id: transaction_id,
        document_type: attachment.document_type,
        file_name: attachment.original_name,
        file_path: filePath,
        file_size: attachment.size,
        mime_type: attachment.mime_type,
        uploaded_by: user_id,
        status: 'ACTIVE'
      });
      
      uploadedDocuments.push(document);
      console.log(`✅ Document ${index + 1} uploaded: ${document.id}`);
    }
    
    console.log(`🎉 [DOCUMENT] All ${uploadedDocuments.length} documents processed successfully`);
    
    // Publish completion event
    await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, {
      event_type: EVENT_TYPES.DOCUMENT_COMPLETED,
      transaction_id,
      land_title_id,
      uploaded_documents: uploadedDocuments,
      total_documents: uploadedDocuments.length
    });
    
  } catch (error) {
    console.error(`❌ [DOCUMENT] Upload failed: ${transaction_id}`, error);
    
    // Cleanup uploaded files on failure
    await cleanupUploadedFiles(uploadedDocuments);
    
    // Publish failure event
    await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, {
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

const cleanupUploadedFiles = async (uploadedDocuments) => {
  for (const doc of uploadedDocuments) {
    try {
      await fs.unlink(doc.file_path);
      console.log(`🗑️ Cleaned up file: ${doc.file_path}`);
    } catch (error) {
      console.error(`Failed to cleanup file: ${doc.file_path}`, error);
    }
  }
};

module.exports = {
  processDocumentUpload
};