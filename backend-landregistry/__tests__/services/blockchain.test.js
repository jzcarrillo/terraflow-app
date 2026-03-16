jest.mock('../../services/blockchain-client', () => ({
  getTransactionHistory: jest.fn(),
  getLandTitle: jest.fn()
}));

const blockchainClient = require('../../services/blockchain-client');
const blockchainService = require('../../services/blockchain');

describe('Blockchain Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getBlockchainHistory', () => {
    it('should return history when found', async () => {
      blockchainClient.getTransactionHistory.mockResolvedValue([{ id: 1, hash: 'abc' }]);
      const result = await blockchainService.getBlockchainHistory('TCT-001');
      expect(result).toEqual([{ id: 1, hash: 'abc' }]);
    });

    it('should return empty array when no history', async () => {
      blockchainClient.getTransactionHistory.mockResolvedValue([]);
      const result = await blockchainService.getBlockchainHistory('TCT-001');
      expect(result).toEqual([]);
    });

    it('should return empty array on null response', async () => {
      blockchainClient.getTransactionHistory.mockResolvedValue(null);
      const result = await blockchainService.getBlockchainHistory('TCT-001');
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      blockchainClient.getTransactionHistory.mockRejectedValue(new Error('gRPC error'));
      const result = await blockchainService.getBlockchainHistory('TCT-001');
      expect(result).toEqual([]);
    });
  });

  it('should export queryLandTitle', () => {
    expect(blockchainService.queryLandTitle).toBeDefined();
  });

  it('should export verifyBlockchainHash', () => {
    expect(blockchainService.verifyBlockchainHash).toBeDefined();
  });
});
