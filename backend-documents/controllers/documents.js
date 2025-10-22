const documentService = require('../services/document');
const { streamFile } = require('../utils/fileHandler');
const { handleError } = require('../utils/errorHandler');

const getDocumentsByLandTitle = async (req, res) => {
  try {
    const { landTitleId } = req.params;
    const documents = await documentService.getDocumentsByLandTitleId(landTitleId);
    
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      document_type: doc.document_type,
      original_name: doc.file_name,
      size: doc.file_size,
      mime_type: doc.mime_type,
      created_at: doc.created_at
    }));
    
    res.json(formattedDocs);
  } catch (error) {
    handleError(error, res, 'Get documents');
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await documentService.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    streamFile(document.file_path, document.file_name, document.mime_type, document.file_size, res, 'attachment');
  } catch (error) {
    handleError(error, res, 'Download document');
  }
};

const viewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await documentService.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    streamFile(document.file_path, document.file_name, document.mime_type, document.file_size, res, 'inline');
  } catch (error) {
    handleError(error, res, 'View document');
  }
};

module.exports = {
  getDocumentsByLandTitle,
  downloadDocument,
  viewDocument
};