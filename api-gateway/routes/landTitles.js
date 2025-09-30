const express = require('express');
const router = express.Router();
const landTitleController = require('../controllers/landTitleController');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

// LAND TITLE ENDPOINTS
router.post('/land-titles', authenticateToken, uploadMultiple, handleUploadError, landTitleController.createLandTitle);
router.get('/land-titles', authenticateToken, landTitleController.getAllLandTitles);
router.get('/land-titles/:id', authenticateToken, landTitleController.getLandTitle);

module.exports = router;