const documentService = require('../services/document');
const { streamFile } = require('../utils/fileHandler');
const { handleError } = require('../utils/errorHandler');

const formatDocs = (documents) => documents.map(doc => ({
  id: doc.id,
  document_type: doc.document_type,
  original_name: doc.file_name,
  size: doc.file_size,
  mime_type: doc.mime_type,
  created_at: doc.created_at
}));

const getDocumentsByLandTitle = async (req, res) => {
  try {
    const documents = await documentService.getDocumentsByLandTitleId(req.params.landTitleId);
    res.json(formatDocs(documents));
  } catch (error) {
    handleError(error, res, 'Get documents');
  }
};

const getDocumentsByMortgage = async (req, res) => {
  try {
    const documents = await documentService.getDocumentsByMortgageId(req.params.mortgageId);
    res.json(formatDocs(documents));
  } catch (error) {
    handleError(error, res, 'Get mortgage documents');
  }
};

const serveDocument = async (req, res, disposition) => {
  const document = await documentService.getDocumentById(req.params.documentId);
  if (!document) return res.status(404).json({ error: 'Document not found' });
  streamFile(document.file_path, document.file_name, document.mime_type, document.file_size, res, disposition);
};

const downloadDocument = async (req, res) => {
  try {
    await serveDocument(req, res, 'attachment');
  } catch (error) {
    handleError(error, res, 'Download document');
  }
};

const viewDocument = async (req, res) => {
  try {
    await serveDocument(req, res, 'inline');
  } catch (error) {
    handleError(error, res, 'View document');
  }
};

module.exports = {
  getDocumentsByLandTitle,
  getDocumentsByMortgage,
  downloadDocument,
  viewDocument
};