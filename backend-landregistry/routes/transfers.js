const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfers');
const { authenticateToken } = require('../middleware/auth');

// TRANSFER ENDPOINTS
router.post('/', authenticateToken, transferController.submitTransfer);
router.get('/', authenticateToken, transferController.getAllTransfers);
router.put('/:id', authenticateToken, transferController.updateTransferStatus);
router.delete('/:id', authenticateToken, transferController.deleteTransfer);

module.exports = router;