const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const landTitleController = require('../controllers/landTitleController');

router.get('/land-titles', authenticateToken, landTitleController.getAllLandTitles);
router.post('/land-titles', authenticateToken, landTitleController.createLandTitle);
router.put('/land-titles/:id', authenticateToken, landTitleController.updateLandTitle);
router.put('/land-titles/:id/status', authenticateToken, landTitleController.updateLandTitleStatus);
router.put('/land-titles/:id/cancel', authenticateToken, landTitleController.cancelLandTitle);

module.exports = router;