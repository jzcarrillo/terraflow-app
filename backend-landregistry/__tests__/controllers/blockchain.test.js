const blockchainController = require('../../controllers/blockchain');
const blockchainService = require('../../services/blockchain');

jest.mock('../../services/blockchain');

describe('Blockchain Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('queryLandTitle', () => {
    it('should query land title from blockchain', async () => {
      req.params.titleNumber = 'TCT-001';
      const mockData = { title_number: 'TCT-001', owner: 'Owner' };
      blockchainService.queryLandTitle.mockResolvedValue(mockData);

      await blockchainController.queryLandTitle(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        title_number: 'TCT-001',
        blockchain_data: mockData,
        query_timestamp: expect.any(String)
      });
    });

    it('should handle errors', async () => {
      req.params.titleNumber = 'TCT-001';
      blockchainService.queryLandTitle.mockRejectedValue(new Error('Blockchain error'));

      await blockchainController.queryLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getBlockchainHistory', () => {
    it('should return blockchain history', async () => {
      req.params.titleNumber = 'TCT-001';
      const mockHistory = [{ event: 'CREATED' }, { event: 'TRANSFERRED' }];
      blockchainService.getBlockchainHistory.mockResolvedValue(mockHistory);

      await blockchainController.getBlockchainHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        title_number: 'TCT-001',
        history: mockHistory,
        query_timestamp: expect.any(String)
      });
    });
  });

  describe('verifyBlockchainHash', () => {
    it('should verify blockchain hash', async () => {
      req.body = { title_number: 'TCT-001', blockchain_hash: 'hash123' };

      await blockchainController.verifyBlockchainHash(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        title_number: 'TCT-001',
        blockchain_hash: 'hash123',
        is_valid: true,
        verification_timestamp: expect.any(String)
      });
    });

    it('should return 400 if title_number missing', async () => {
      req.body = { blockchain_hash: 'hash123' };

      await blockchainController.verifyBlockchainHash(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if blockchain_hash missing', async () => {
      req.body = { title_number: 'TCT-001' };

      await blockchainController.verifyBlockchainHash(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
