const express = require('express');
const router = express.Router();
const mortgageController = require('../controllers/mortgages');
const { authenticateToken } = require('../middleware/auth');
const { uploadAttachments } = require('../middleware/upload');

router.get('/mortgages', authenticateToken, mortgageController.getAllMortgages);
router.get('/mortgages/available-titles', authenticateToken, mortgageController.getLandTitlesForMortgage);
router.get('/mortgages/for-payment', authenticateToken, mortgageController.getMortgagesForPayment);
router.get('/mortgages/check-transfer/:id', authenticateToken, mortgageController.checkTransferEligibility);
router.get('/mortgages/:id/attachments', authenticateToken, mortgageController.getMortgageAttachments);
router.get('/mortgages/attachments/view/:documentId', mortgageController.viewAttachment);
router.get('/mortgages/attachments/download/:documentId', mortgageController.downloadAttachment);
router.get('/mortgages/:id', authenticateToken, mortgageController.getMortgageById);
router.post('/land-titles/:id/mortgage', authenticateToken, uploadAttachments, mortgageController.createMortgage);
router.put('/mortgages/:id', authenticateToken, mortgageController.updateMortgage);
router.delete('/mortgages/:id', authenticateToken, mortgageController.cancelMortgage);
router.post('/mortgages/:id/release', authenticateToken, mortgageController.releaseMortgage);

module.exports = router;
