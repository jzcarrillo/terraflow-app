jest.mock('fabric-contract-api', () => ({
  Contract: class Contract {}
}), { virtual: true });

const LandTitleContract = require('../../chaincode/land-title-contract');

describe('chaincode/land-title-contract', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    contract = new LandTitleContract();
    ctx = {
      stub: {
        putState: jest.fn(),
        getState: jest.fn(),
        setEvent: jest.fn(),
        getTxID: jest.fn().mockReturnValue('tx-123'),
        getTxTimestamp: jest.fn().mockReturnValue({ seconds: { low: 1700000000, toString: () => '1700000000' } }),
        getHistoryForKey: jest.fn(),
        getStateByRange: jest.fn()
      }
    };
  });

  describe('InitLedger', () => {
    it('should return initialization message', async () => {
      const result = await contract.InitLedger(ctx);
      expect(JSON.parse(result).message).toBe('Land Title Ledger initialized successfully');
    });
  });

  describe('CreateLandTitle', () => {
    it('should create a land title', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from(''));
      const result = await contract.CreateLandTitle(ctx, 'TCT-001', 'Owner', 'Manila', 'ACTIVE', 'REF-1', '1700000000', 'TXN-1');
      const parsed = JSON.parse(result);
      expect(parsed.transactionId).toBe('tx-123');
      expect(parsed.landTitle.titleNumber).toBe('TCT-001');
      expect(ctx.stub.putState).toHaveBeenCalled();
      expect(ctx.stub.setEvent).toHaveBeenCalledWith('LandTitleCreated', expect.any(Buffer));
    });

    it('should throw if land title already exists', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from('{"titleNumber":"TCT-001"}'));
      await expect(contract.CreateLandTitle(ctx, 'TCT-001', 'Owner', 'Manila', 'ACTIVE', 'REF-1', '1700000000', 'TXN-1'))
        .rejects.toThrow('Failed to create land title');
    });
  });

  describe('GetLandTitle', () => {
    it('should return land title', async () => {
      const data = { titleNumber: 'TCT-001', ownerName: 'Owner' };
      ctx.stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(data)));
      const result = await contract.GetLandTitle(ctx, 'TCT-001');
      expect(JSON.parse(result)).toEqual(data);
    });

    it('should throw if not found', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from(''));
      await expect(contract.GetLandTitle(ctx, 'TCT-999')).rejects.toThrow('Failed to get land title');
    });
  });

  describe('UpdateLandTitleStatus', () => {
    it('should update status', async () => {
      const data = { titleNumber: 'TCT-001', status: 'ACTIVE' };
      ctx.stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(data)));
      const result = await contract.UpdateLandTitleStatus(ctx, 'TCT-001', 'CANCELLED', 'TXN-2');
      const parsed = JSON.parse(result);
      expect(parsed.landTitle.status).toBe('CANCELLED');
      expect(ctx.stub.putState).toHaveBeenCalled();
      expect(ctx.stub.setEvent).toHaveBeenCalledWith('LandTitleStatusUpdated', expect.any(Buffer));
    });

    it('should throw if not found', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from(''));
      await expect(contract.UpdateLandTitleStatus(ctx, 'TCT-999', 'CANCELLED', 'TXN-2'))
        .rejects.toThrow('Failed to update status');
    });
  });

  describe('LandTitleExists', () => {
    it('should return true if exists', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from('{"data":"exists"}'));
      expect(await contract.LandTitleExists(ctx, 'TCT-001')).toBe(true);
    });

    it('should return false if not exists', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from(''));
      expect(await contract.LandTitleExists(ctx, 'TCT-999')).toBe(false);
    });
  });

  describe('GetLandTitleHistory', () => {
    it('should return history', async () => {
      const mockIterator = {
        next: jest.fn()
          .mockResolvedValueOnce({
            value: { txId: 'tx1', timestamp: 't1', isDelete: false, value: Buffer.from('{"status":"ACTIVE"}') },
            done: false
          })
          .mockResolvedValueOnce({ done: true }),
        close: jest.fn()
      };
      ctx.stub.getHistoryForKey.mockResolvedValue(mockIterator);
      const result = JSON.parse(await contract.GetLandTitleHistory(ctx, 'TCT-001'));
      expect(result.history).toHaveLength(1);
    });

    it('should handle error', async () => {
      ctx.stub.getHistoryForKey.mockRejectedValue(new Error('fail'));
      await expect(contract.GetLandTitleHistory(ctx, 'TCT-001')).rejects.toThrow('Failed to get history');
    });
  });

  describe('GetAllLandTitles', () => {
    it('should return all titles', async () => {
      const mockIterator = {
        next: jest.fn()
          .mockResolvedValueOnce({
            value: { key: 'TCT-001', value: Buffer.from('{"titleNumber":"TCT-001"}') },
            done: false
          })
          .mockResolvedValueOnce({ done: true }),
        close: jest.fn()
      };
      ctx.stub.getStateByRange.mockResolvedValue(mockIterator);
      const result = JSON.parse(await contract.GetAllLandTitles(ctx));
      expect(result).toHaveLength(1);
    });

    it('should handle error', async () => {
      ctx.stub.getStateByRange.mockRejectedValue(new Error('fail'));
      await expect(contract.GetAllLandTitles(ctx)).rejects.toThrow('Failed to get all land titles');
    });
  });

  describe('GetTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockIterator = {
        next: jest.fn()
          .mockResolvedValueOnce({
            value: {
              txId: 'tx1', timestamp: { seconds: { low: 1700000 } },
              isDelete: false, value: Buffer.from('{"transactionType":"CREATED","ownerName":"Owner"}')
            },
            done: false
          })
          .mockResolvedValueOnce({ done: true }),
        close: jest.fn()
      };
      ctx.stub.getHistoryForKey.mockResolvedValue(mockIterator);
      const result = JSON.parse(await contract.GetTransactionHistory(ctx, 'TCT-001'));
      expect(result).toHaveLength(1);
      expect(result[0].transaction_type).toBe('CREATED');
    });

    it('should return empty array on error', async () => {
      ctx.stub.getHistoryForKey.mockRejectedValue(new Error('fail'));
      const result = JSON.parse(await contract.GetTransactionHistory(ctx, 'TCT-001'));
      expect(result).toEqual([]);
    });
  });

  describe('TransferLandTitle', () => {
    it('should transfer land title', async () => {
      const data = { titleNumber: 'TCT-001', ownerName: 'OldOwner', status: 'ACTIVE' };
      ctx.stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(data)));
      const result = await contract.TransferLandTitle(ctx, 'TCT-001', 'OldOwner', 'NewOwner', '5000', '1700000000', 'SALE', 'TRF-1');
      const parsed = JSON.parse(result);
      expect(parsed.landTitle.ownerName).toBe('NewOwner');
      expect(parsed.landTitle.transactionType).toBe('TRANSFER');
      expect(ctx.stub.setEvent).toHaveBeenCalledWith('LandTitleTransferred', expect.any(Buffer));
    });

    it('should throw if not found', async () => {
      ctx.stub.getState.mockResolvedValue(Buffer.from(''));
      await expect(contract.TransferLandTitle(ctx, 'TCT-999', 'A', 'B', '100', '1', 'SALE', 'TRF-1'))
        .rejects.toThrow('Failed to transfer land title');
    });
  });
});
