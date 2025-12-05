const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const blockchainController = require('../controllers/blockchain');

router.get('/query/:titleNumber', authenticateToken, blockchainController.queryLandTitle); // QUERY LAND TITLE FROM BLOCKCHAIN
router.get('/history/:titleNumber', authenticateToken, blockchainController.getBlockchainHistory); // GET BLOCKCHAIN TRANSACTION HISTORY
router.post('/verify', authenticateToken, blockchainController.verifyBlockchainHash); // VERIFY BLOCKCHAIN HASH

module.exports = router;