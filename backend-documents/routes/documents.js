const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documents');
const { authenticateToken } = require('../utils/auth');

// DOCUMENT ENDPOINTS
router.get('/land-title/:landTitleId', authenticateToken, documentController.getDocumentsByLandTitle);
router.get('/download/:documentId', authenticateToken, documentController.downloadDocument);
router.get('/view/:documentId', documentController.viewDocument);

module.exports = router;