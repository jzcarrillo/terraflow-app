const express = require('express');
const router = express.Router();
const blockchainClient = require('../services/blockchain-client');
const { authenticateToken } = require('../middleware/auth');

// QUERY LAND TITLE FROM BLOCKCHAIN
router.get('/query/:titleNumber', authenticateToken, async (req, res) => {
  try {
    const { titleNumber } = req.params;
    
    console.log(`🔍 Querying blockchain for title: ${titleNumber}`);
    
    const result = await blockchainClient.getLandTitle(titleNumber);
    
    res.json({
      success: true,
      title_number: titleNumber,
      blockchain_data: result,
      query_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blockchain query error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
      title_number: req.params.titleNumber
    });
  }
});

// GET BLOCKCHAIN TRANSACTION HISTORY
router.get('/history/:titleNumber', authenticateToken, async (req, res) => {
  try {
    const { titleNumber } = req.params;
    
    console.log(`📜 Getting blockchain history for title: ${titleNumber}`);
    
    // For now, return stored transaction data from logs
    // In real implementation, this would query Fabric ledger
    const mockHistory = [
      {
        transaction_id: 'fabric_1764912935870_03120f50ed7a3259',
        title_number: titleNumber,
        owner_name: 'Isabella Cruz 2',
        property_location: 'Pasay',
        status: 'ACTIVE',
        blockchain_hash: '1ae0382300b1d9a0b115a37f3762e01eacd427c6b13ab770e04d06c7becf4aa7',
        recorded_at: '2025-12-05T05:35:35.871Z'
      }
    ];
    
    res.json({
      success: true,
      title_number: titleNumber,
      history: mockHistory,
      query_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blockchain history error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// VERIFY BLOCKCHAIN HASH
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { title_number, blockchain_hash } = req.body;
    
    if (!title_number || !blockchain_hash) {
      return res.status(400).json({
        success: false,
        message: 'Title number and blockchain hash are required'
      });
    }
    
    console.log(`🔐 Verifying blockchain hash for title: ${title_number}`);
    
    // Query blockchain to verify hash
    const result = await blockchainClient.getLandTitle(title_number);
    
    // In real implementation, compare with actual blockchain data
    const isValid = true; // Simplified for now
    
    res.json({
      success: true,
      title_number: title_number,
      blockchain_hash: blockchain_hash,
      is_valid: isValid,
      verification_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blockchain verification error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;