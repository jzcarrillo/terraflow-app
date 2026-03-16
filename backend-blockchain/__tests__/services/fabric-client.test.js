jest.mock('fabric-network', () => ({
  Gateway: jest.fn().mockImplementation(() => ({ disconnect: jest.fn() })),
  Wallets: { newFileSystemWallet: jest.fn().mockResolvedValue({}) }
}));
jest.mock('fabric-ca-client', () => jest.fn());
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

const fs = require('fs');
const FabricClient = require('../../services/fabric-client');

describe('services/fabric-client', () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new FabricClient();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(client.connected).toBe(false);
      expect(client.transactionStore).toBeInstanceOf(Map);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{}');
      const result = await client.initialize();
      expect(result).toBe(true);
      expect(client.connected).toBe(true);
    });

    it('should throw if connection profile not found', async () => {
      fs.existsSync.mockReturnValue(false);
      await expect(client.initialize()).rejects.toThrow('Connection profile not found');
    });
  });

  describe('submitTransaction', () => {
    beforeEach(() => { client.connected = true; });

    it('should submit CreateLandTitle', async () => {
      const result = await client.submitTransaction('CreateLandTitle', 'TCT-001', 'Owner', 'Manila', 'ACTIVE', 'REF-1', '1700000000', 'TXN-1');
      expect(result.success).toBe(true);
      expect(result.blockchain_hash).toBeDefined();
      expect(client.transactionStore.get('TCT-001')[0].transaction_type).toBe('CREATED');
    });

    it('should submit CancelLandTitle', async () => {
      const result = await client.submitTransaction('CancelLandTitle', 'TCT-001', 'ACTIVE', 'PENDING', 'hash', 'reason', '1700000000', 'TXN-2');
      expect(result.success).toBe(true);
      expect(client.transactionStore.get('TCT-001')[0].transaction_type).toBe('CANCELLED');
    });

    it('should submit ReactivateLandTitle', async () => {
      const result = await client.submitTransaction('ReactivateLandTitle', 'TCT-001', 'PENDING', 'ACTIVE', 'hash', 'cancel_hash', 'reason', '1700000000', 'TXN-3');
      expect(result.success).toBe(true);
      expect(client.transactionStore.get('TCT-001')[0].transaction_type).toBe('REACTIVATED');
    });

    it('should submit TransferLandTitle', async () => {
      const result = await client.submitTransaction('TransferLandTitle', 'TCT-001', 'Seller', 'Buyer', '5000', '1700000000', 'SALE', 'TRF-1', 'Buyer');
      expect(result.success).toBe(true);
      const tx = client.transactionStore.get('TCT-001')[0];
      expect(tx.transaction_type).toBe('TRANSFER');
      expect(tx.from_owner).toBe('Seller');
    });

    it('should submit OTHER transaction type', async () => {
      const result = await client.submitTransaction('CreateMortgage', 'M-001', '10', 'Bank', '500000', 'ACTIVE', '1700000000', 'TXN-M1');
      expect(result.success).toBe(true);
      expect(client.transactionStore.get('M-001')[0].transaction_type).toBe('OTHER');
    });

    it('should initialize if not connected', async () => {
      client.connected = false;
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{}');
      const result = await client.submitTransaction('CreateLandTitle', 'TCT-001', 'Owner', 'Manila', 'ACTIVE', 'REF-1', '1700000000', 'TXN-1');
      expect(result.success).toBe(true);
    });

    it('should append to existing store', async () => {
      await client.submitTransaction('CreateLandTitle', 'TCT-001', 'Owner', 'Manila', 'ACTIVE', 'REF-1', '1700000000', 'TXN-1');
      await client.submitTransaction('CancelLandTitle', 'TCT-001', 'ACTIVE', 'PENDING', 'hash', 'reason', '1700000000', 'TXN-2');
      expect(client.transactionStore.get('TCT-001')).toHaveLength(2);
    });
  });

  describe('evaluateTransaction', () => {
    beforeEach(() => { client.connected = true; });

    it('should return transaction history', async () => {
      client.transactionStore.set('TCT-001', [{ blockchain_hash: 'h1' }]);
      const result = await client.evaluateTransaction('GetTransactionHistory', 'TCT-001');
      expect(result).toEqual([{ blockchain_hash: 'h1' }]);
    });

    it('should return empty for no history', async () => {
      const result = await client.evaluateTransaction('GetTransactionHistory', 'TCT-999');
      expect(result).toEqual([]);
    });

    it('should return land title for GetLandTitle', async () => {
      const result = await client.evaluateTransaction('GetLandTitle', 'TCT-001');
      expect(result.success).toBe(true);
      expect(result.data.title_number).toBe('TCT-001');
    });

    it('should return default for other queries', async () => {
      const result = await client.evaluateTransaction('GetLandTitleHistory', 'TCT-001');
      expect(result.success).toBe(true);
    });

    it('should initialize if not connected', async () => {
      client.connected = false;
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{}');
      const result = await client.evaluateTransaction('GetLandTitle', 'TCT-001');
      expect(result.success).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect gateway', async () => {
      await client.disconnect();
      expect(client.connected).toBe(false);
    });

    it('should handle disconnect error', async () => {
      client.gateway = { disconnect: jest.fn().mockRejectedValue(new Error('err')) };
      jest.spyOn(console, 'error').mockImplementation();
      await client.disconnect();
      jest.restoreAllMocks();
    });
  });

  describe('error paths', () => {
    it('should throw on submitTransaction failure', async () => {
      client.connected = true;
      // Force crypto to throw
      jest.spyOn(require('crypto'), 'randomBytes').mockImplementationOnce(() => { throw new Error('crypto fail'); });
      await expect(client.submitTransaction('CreateLandTitle', 'T1')).rejects.toThrow('crypto fail');
      jest.restoreAllMocks();
    });

    it('should throw on evaluateTransaction failure', async () => {
      client.connected = true;
      // Force error by making transactionStore.get throw
      const origGet = client.transactionStore.get.bind(client.transactionStore);
      client.transactionStore.get = () => { throw new Error('store fail'); };
      await expect(client.evaluateTransaction('GetTransactionHistory', 'T1')).rejects.toThrow('store fail');
      client.transactionStore.get = origGet;
    });
  });
});
