const express = require('express');
const router = express.Router();
const landTitleController = require('../controllers/landtitles');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadAttachments, handleUploadError } = require('../middleware/upload');

// LAND TITLE ENDPOINTS
router.post('/land-titles', authenticateToken, uploadAttachments, handleUploadError, landTitleController.createLandTitle);
router.get('/land-titles', authenticateToken, landTitleController.getAllLandTitles);
router.get('/land-titles/validate/:titleNumber', landTitleController.validateTitleNumber);
router.get('/land-titles/:id', authenticateToken, landTitleController.getLandTitle);
router.get('/attachments/download/:documentId', authenticateToken, landTitleController.downloadAttachment);
router.get('/attachments/view/:documentId', landTitleController.viewAttachment);

module.exports = router;