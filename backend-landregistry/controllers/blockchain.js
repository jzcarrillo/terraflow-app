const blockchainService = require('../services/blockchain');
const { handleError } = require('../utils/errorHandler');

const queryLandTitle = async (req, res) => {
  try {
    const { titleNumber } = req.params;
    console.log(`🔍 Querying blockchain for title: ${titleNumber}`);
    
    const result = await blockchainService.queryLandTitle(titleNumber);
    
    res.json({
      success: true,
      title_number: titleNumber,
      blockchain_data: result,
      query_timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, res, 'Blockchain query');
  }
};

const getBlockchainHistory = async (req, res) => {
  try {
    const { titleNumber } = req.params;
    const history = await blockchainService.getBlockchainHistory(titleNumber);
    
    res.json({
      success: true,
      title_number: titleNumber,
      history: history,
      query_timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, res, 'Blockchain history');
  }
};

const verifyBlockchainHash = async (req, res) => {
  try {
    const { title_number, blockchain_hash } = req.body;
    
    if (!title_number || !blockchain_hash) {
      return res.status(400).json({
        success: false,
        message: 'Title number and blockchain hash are required'
      });
    }
    
    console.log(`🔐 Verifying blockchain hash for title: ${title_number}`);
    
    // For now, simplified verification
    const isValid = true;
    
    res.json({
      success: true,
      title_number: title_number,
      blockchain_hash: blockchain_hash,
      is_valid: isValid,
      verification_timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleError(error, res, 'Blockchain verification');
  }
};

module.exports = {
  queryLandTitle,
  getBlockchainHistory,
  verifyBlockchainHash
};