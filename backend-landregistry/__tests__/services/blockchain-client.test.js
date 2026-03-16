const mockRecordLandTitle = jest.fn();
const mockRecordCancellation = jest.fn();
const mockRecordReactivation = jest.fn();
const mockRecordTransfer = jest.fn();
const mockGetLandTitle = jest.fn();
const mockGetTransactionHistory = jest.fn();
const mockRecordMortgage = jest.fn();
const mockRecordMortgageRelease = jest.fn();

jest.mock('@grpc/grpc-js', () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(() => ({
    blockchain: {
      BlockchainService: jest.fn().mockImplementation(() => ({
        RecordLandTitle: mockRecordLandTitle,
        RecordCancellation: mockRecordCancellation,
        RecordReactivation: mockRecordReactivation,
        RecordTransfer: mockRecordTransfer,
        GetLandTitle: mockGetLandTitle,
        GetTransactionHistory: mockGetTransactionHistory,
        RecordMortgage: mockRecordMortgage,
        RecordMortgageRelease: mockRecordMortgageRelease
      }))
    }
  }))
}));

jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn(() => ({}))
}));

const blockchainClient = require('../../services/blockchain-client');

describe('Blockchain Client', () => {
  describe('recordLandTitle', () => {
    it('should resolve on success', async () => {
      mockRecordLandTitle.mockImplementation((data, opts, cb) => cb(null, { success: true, blockchainHash: 'hash123' }));
      const result = await blockchainClient.recordLandTitle({ title_number: 'TCT-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordLandTitle.mockImplementation((data, opts, cb) => cb(new Error('gRPC error'), null));
      await expect(blockchainClient.recordLandTitle({})).rejects.toThrow('gRPC error');
    });
  });

  describe('recordCancellation', () => {
    it('should resolve on success', async () => {
      mockRecordCancellation.mockImplementation((data, cb) => cb(null, { success: true }));
      const result = await blockchainClient.recordCancellation({ title_number: 'TCT-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordCancellation.mockImplementation((data, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.recordCancellation({})).rejects.toThrow();
    });
  });

  describe('recordReactivation', () => {
    it('should resolve on success', async () => {
      mockRecordReactivation.mockImplementation((data, cb) => cb(null, { success: true }));
      const result = await blockchainClient.recordReactivation({ title_number: 'TCT-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordReactivation.mockImplementation((data, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.recordReactivation({})).rejects.toThrow();
    });
  });

  describe('recordTransfer', () => {
    it('should resolve on success', async () => {
      mockRecordTransfer.mockImplementation((data, opts, cb) => cb(null, { success: true }));
      const result = await blockchainClient.recordTransfer({ transfer_id: 'T-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordTransfer.mockImplementation((data, opts, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.recordTransfer({})).rejects.toThrow();
    });
  });

  describe('getLandTitle', () => {
    it('should resolve on success', async () => {
      mockGetLandTitle.mockImplementation((data, cb) => cb(null, { title_number: 'TCT-001' }));
      const result = await blockchainClient.getLandTitle('1');
      expect(result.title_number).toBe('TCT-001');
    });

    it('should reject on error', async () => {
      mockGetLandTitle.mockImplementation((data, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.getLandTitle('1')).rejects.toThrow();
    });
  });

  describe('getTransactionHistory', () => {
    it('should resolve with transactions', async () => {
      mockGetTransactionHistory.mockImplementation((data, opts, cb) => cb(null, { transactions: [{ id: 1 }] }));
      const result = await blockchainClient.getTransactionHistory('TCT-001');
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should reject on error', async () => {
      mockGetTransactionHistory.mockImplementation((data, opts, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.getTransactionHistory('TCT-001')).rejects.toThrow();
    });
  });

  describe('recordMortgage', () => {
    it('should resolve on success', async () => {
      mockRecordMortgage.mockImplementation((data, opts, cb) => cb(null, { success: true }));
      const result = await blockchainClient.recordMortgage({ mortgage_id: 'M-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordMortgage.mockImplementation((data, opts, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.recordMortgage({})).rejects.toThrow();
    });
  });

  describe('recordMortgageRelease', () => {
    it('should resolve on success', async () => {
      mockRecordMortgageRelease.mockImplementation((data, opts, cb) => cb(null, { success: true }));
      const result = await blockchainClient.recordMortgageRelease({ mortgage_id: 'M-001' });
      expect(result.success).toBe(true);
    });

    it('should reject on error', async () => {
      mockRecordMortgageRelease.mockImplementation((data, opts, cb) => cb(new Error('Error'), null));
      await expect(blockchainClient.recordMortgageRelease({})).rejects.toThrow();
    });
  });
});
