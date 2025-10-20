const express = require('express');
const router = express.Router();
const landTitleController = require('../controllers/landtitles');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { uploadSingle, uploadMultiple, uploadAttachments, handleUploadError } = require('../middleware/upload');

// LAND TITLE ENDPOINTS
router.post('/land-titles', authenticateToken, requireRole(['ADMIN', 'LAND_TITLE_PROCESSOR']), uploadAttachments, handleUploadError, landTitleController.createLandTitle);
router.get('/land-titles', authenticateToken, requireRole(['ADMIN', 'LAND_TITLE_PROCESSOR']), landTitleController.getAllLandTitles);
router.get('/land-titles/validate/:titleNumber', landTitleController.validateTitleNumber);
router.get('/land-titles/:id', authenticateToken, requireRole(['ADMIN', 'LAND_TITLE_PROCESSOR']), landTitleController.getLandTitle);
router.get('/attachments/download/:documentId', authenticateToken, requireRole(['ADMIN', 'LAND_TITLE_PROCESSOR']), landTitleController.downloadAttachment);
router.get('/attachments/view/:documentId', landTitleController.viewAttachment);

module.exports = router;