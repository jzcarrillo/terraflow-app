const blockchainClient = require('./blockchain-client');

const getBlockchainHistory = async (titleNumber) => {
  try {
    console.log(`📜 Getting blockchain history for title: ${titleNumber}`);
    
    // Query blockchain service for transaction history
    const history = await blockchainClient.getTransactionHistory(titleNumber);
    
    if (history && history.length > 0) {
      console.log(`✅ Retrieved ${history.length} blockchain transactions for ${titleNumber}`);
      return history;
    }
    
    console.log(`⚠️ No blockchain history found for ${titleNumber}`);
    return [];
  } catch (error) {
    console.error(`❌ Failed to get blockchain history:`, error.message);
    return [];
  }
};

module.exports = {
  queryLandTitle: blockchainClient.getLandTitle,
  getBlockchainHistory,
  verifyBlockchainHash: blockchainClient.getLandTitle
};