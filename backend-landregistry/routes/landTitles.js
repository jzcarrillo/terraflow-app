const express = require('express');
const router = express.Router();
const landTitleController = require('../controllers/landtitles');
const mortgageController = require('../controllers/mortgages');
const { authenticateToken } = require('../middleware/auth');

// LAND TITLE ENDPOINTS
router.get('/', authenticateToken, landTitleController.getAllLandTitles);
router.get('/validate/land-title-exists', landTitleController.validateLandTitleExists);
router.get('/validate/:titleNumber', landTitleController.validateTitleNumber);
router.get('/:id', authenticateToken, landTitleController.getLandTitleById);

// MORTGAGE ENDPOINTS (nested under land titles)
router.post('/:id/mortgage', authenticateToken, mortgageController.createMortgage);
router.get('/:id/mortgages', authenticateToken, mortgageController.getMortgagesByLandTitle);

module.exports = router;