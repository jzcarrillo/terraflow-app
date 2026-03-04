const express = require('express');
const router = express.Router();
const mortgageController = require('../controllers/mortgages');
const { authenticateToken } = require('../middleware/auth');

// MORTGAGE ENDPOINTS

// Get all mortgages
router.get('/', authenticateToken, mortgageController.getAllMortgages);

// Get land titles available for mortgage
router.get('/available-titles', authenticateToken, mortgageController.getLandTitlesForMortgage);

// Get mortgages for payment dropdown
router.get('/for-payment', authenticateToken, mortgageController.getMortgagesForPayment);

// Check if land title can be transferred (no active mortgages)
router.get('/check-transfer/:id', authenticateToken, mortgageController.checkTransferEligibility);

// Get specific mortgage by ID
router.get('/:id', authenticateToken, mortgageController.getMortgageById);

// Update mortgage
router.put('/:id', authenticateToken, mortgageController.updateMortgage);

// Cancel mortgage
router.delete('/:id', authenticateToken, mortgageController.cancelMortgage);

// Release mortgage
router.post('/:id/release', authenticateToken, mortgageController.releaseMortgage);

module.exports = router;
