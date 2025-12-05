const blockchainClient = require('./blockchain-client');

const getBlockchainHistory = async (titleNumber) => {
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
  
  return mockHistory;
};

module.exports = {
  queryLandTitle: blockchainClient.getLandTitle,
  getBlockchainHistory,
  verifyBlockchainHash: blockchainClient.getLandTitle
};