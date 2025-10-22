const express = require('express');
const router = express.Router();
const landTitleController = require('../controllers/landtitles');
const { authenticateToken } = require('../middleware/auth');

// LAND TITLE ENDPOINTS
router.get('/', authenticateToken, landTitleController.getAllLandTitles);
router.get('/validate/land-title-exists', landTitleController.validateLandTitleExists);
router.get('/validate/:titleNumber', landTitleController.validateTitleNumber);
router.get('/:id', authenticateToken, landTitleController.getLandTitleById);

module.exports = router;