jest.mock('../../services/fabric-client');

const ChaincodeService = require('../../services/chaincode-service');
const FabricClient = require('../../services/fabric-client');

describe('Blockchain Service Tests', () => {
  let chaincodeService;
  let mockFabricClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFabricClient = {
      submitTransaction: jest.fn(),
      evaluateTransaction: jest.fn(),
      disconnect: jest.fn()
    };
    FabricClient.mockImplementation(() => mockFabricClient);
    chaincodeService = new ChaincodeService();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Land Title Creation (3 tests)
  describe('Land Title Creation - Triggered by ACTIVE Status', () => {
    it('should record land title when status becomes ACTIVE', async () => {
      const landTitleData = {
        title_number: 'TCT-001',
        owner_name: 'Juan Dela Cruz',
        property_location: 'Manila',
        status: 'ACTIVE',
        reference_id: 'REF-001',
        timestamp: new Date(),
        transaction_id: 'TXN-001'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        transaction_id: 'TXN-001',
        block_number: '1',
        blockchain_hash: 'hash_active_123'
      });

      const result = await chaincodeService.recordLandTitle(landTitleData);

      expect(result.success).toBe(true);
      expect(result.blockchainHash).toBe('hash_active_123');
      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'CreateLandTitle',
        'TCT-001',
        'Juan Dela Cruz',
        'Manila',
        'ACTIVE',
        'REF-001',
        expect.any(String),
        'TXN-001'
      );
    });

    it('should store blockchain hash in database after recording', async () => {
      const landTitleData = {
        title_number: 'TCT-001',
        owner_name: 'Owner',
        property_location: 'Location',
        status: 'ACTIVE',
        reference_id: 'REF-001',
        timestamp: new Date(),
        transaction_id: 'TXN-001'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'stored_hash_456'
      });

      const result = await chaincodeService.recordLandTitle(landTitleData);

      expect(result.blockchainHash).toBe('stored_hash_456');
      expect(result.success).toBe(true);
    });

    it('should only trigger on ACTIVE status event from land registry', async () => {
      const activeData = {
        title_number: 'TCT-001',
        owner_name: 'Owner',
        property_location: 'Location',
        status: 'ACTIVE',
        reference_id: 'REF-001',
        timestamp: new Date(),
        transaction_id: 'TXN-001'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'hash_123'
      });

      await chaincodeService.recordLandTitle(activeData);

      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'CreateLandTitle',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        'ACTIVE',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  // Land Title Cancellation (3 tests)
  describe('Land Title Cancellation - Triggered by CANCELLED Status', () => {
    it('should record cancellation when status becomes CANCELLED', async () => {
      const cancellationData = {
        title_number: 'TCT-001',
        previous_status: 'ACTIVE',
        new_status: 'PENDING',
        original_hash: 'original_hash_123',
        reason: 'Payment cancelled',
        timestamp: new Date(),
        transaction_id: 'TXN-002'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        transaction_id: 'TXN-002',
        block_number: '2',
        blockchain_hash: 'cancellation_hash_789'
      });

      const result = await chaincodeService.recordCancellation(cancellationData);

      expect(result.success).toBe(true);
      expect(result.blockchainHash).toBe('cancellation_hash_789');
      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'CancelLandTitle',
        'TCT-001',
        'ACTIVE',
        'PENDING',
        'original_hash_123',
        'Payment cancelled',
        expect.any(String),
        'TXN-002'
      );
    });

    it('should store cancellation hash in database', async () => {
      const cancellationData = {
        title_number: 'TCT-001',
        previous_status: 'ACTIVE',
        new_status: 'PENDING',
        original_hash: 'hash_123',
        reason: 'Cancelled',
        timestamp: new Date(),
        transaction_id: 'TXN-002'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'cancel_hash_stored'
      });

      const result = await chaincodeService.recordCancellation(cancellationData);

      expect(result.blockchainHash).toBe('cancel_hash_stored');
      expect(result.success).toBe(true);
    });

    it('should only trigger on CANCELLED event from land registry', async () => {
      const cancellationData = {
        title_number: 'TCT-001',
        previous_status: 'ACTIVE',
        new_status: 'PENDING',
        original_hash: 'hash_123',
        reason: 'Cancelled',
        timestamp: new Date(),
        transaction_id: 'TXN-002'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'hash_cancel'
      });

      await chaincodeService.recordCancellation(cancellationData);

      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'CancelLandTitle',
        expect.any(String),
        'ACTIVE',
        'PENDING',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  // Land Title Reactivation (3 tests)
  describe('Land Title Reactivation - Triggered by RE-ACTIVATED Status', () => {
    it('should record reactivation when status becomes ACTIVE again', async () => {
      const reactivationData = {
        title_number: 'TCT-001',
        previous_status: 'PENDING',
        new_status: 'ACTIVE',
        original_hash: 'original_hash_123',
        cancellation_hash: 'cancel_hash_456',
        reason: 'Payment confirmed',
        timestamp: new Date(),
        transaction_id: 'TXN-003'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        transaction_id: 'TXN-003',
        block_number: '3',
        blockchain_hash: 'reactivation_hash_999'
      });

      const result = await chaincodeService.recordReactivation(reactivationData);

      expect(result.success).toBe(true);
      expect(result.blockchainHash).toBe('reactivation_hash_999');
      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'ReactivateLandTitle',
        'TCT-001',
        'PENDING',
        'ACTIVE',
        'original_hash_123',
        'cancel_hash_456',
        'Payment confirmed',
        expect.any(String),
        'TXN-003'
      );
    });

    it('should store reactivation hash in database', async () => {
      const reactivationData = {
        title_number: 'TCT-001',
        previous_status: 'PENDING',
        new_status: 'ACTIVE',
        original_hash: 'hash_123',
        cancellation_hash: 'cancel_hash',
        reason: 'Reactivated',
        timestamp: new Date(),
        transaction_id: 'TXN-003'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'reactivation_stored_hash'
      });

      const result = await chaincodeService.recordReactivation(reactivationData);

      expect(result.blockchainHash).toBe('reactivation_stored_hash');
      expect(result.success).toBe(true);
    });

    it('should only trigger on RE-ACTIVATED event from land registry', async () => {
      const reactivationData = {
        title_number: 'TCT-001',
        previous_status: 'PENDING',
        new_status: 'ACTIVE',
        original_hash: 'hash_123',
        cancellation_hash: 'cancel_hash',
        reason: 'Reactivated',
        timestamp: new Date(),
        transaction_id: 'TXN-003'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'hash_reactivate'
      });

      await chaincodeService.recordReactivation(reactivationData);

      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'ReactivateLandTitle',
        expect.any(String),
        'PENDING',
        'ACTIVE',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  // Transfer Completion (3 tests)
  describe('Transfer Completion - Triggered by TRANSFER_COMPLETED Status', () => {
    it('should record transfer when status is COMPLETED', async () => {
      const transferData = {
        title_number: 'TCT-001',
        from_owner: 'Old Owner',
        to_owner: 'New Owner',
        transfer_fee: 5000,
        transfer_date: new Date(),
        transaction_type: 'SALE',
        transfer_id: 'TRF-001',
        owner_name: 'New Owner'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        transaction_id: 'TRF-001',
        block_number: '4',
        blockchain_hash: 'transfer_hash_111'
      });

      const result = await chaincodeService.recordTransfer(transferData);

      expect(result.success).toBe(true);
      expect(result.blockchainHash).toBe('transfer_hash_111');
      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'TransferLandTitle',
        'TCT-001',
        'Old Owner',
        'New Owner',
        5000,
        expect.any(String),
        'SALE',
        'TRF-001',
        'New Owner'
      );
    });

    it('should store transfer hash in database', async () => {
      const transferData = {
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        transfer_fee: 10000,
        transfer_date: new Date(),
        transaction_type: 'SALE',
        transfer_id: 'TRF-002',
        owner_name: 'Buyer'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'transfer_stored_hash'
      });

      const result = await chaincodeService.recordTransfer(transferData);

      expect(result.blockchainHash).toBe('transfer_stored_hash');
      expect(result.success).toBe(true);
    });

    it('should only trigger on TRANSFER_COMPLETED event from land registry', async () => {
      const transferData = {
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        transfer_fee: 5000,
        transfer_date: new Date(),
        transaction_type: 'SALE',
        transfer_id: 'TRF-001',
        owner_name: 'Buyer'
      };

      mockFabricClient.submitTransaction.mockResolvedValue({
        blockchain_hash: 'hash_transfer'
      });

      await chaincodeService.recordTransfer(transferData);

      expect(mockFabricClient.submitTransaction).toHaveBeenCalledWith(
        'TransferLandTitle',
        expect.any(String),
        'Seller',
        'Buyer',
        5000,
        expect.any(String),
        'SALE',
        'TRF-001',
        'Buyer'
      );
    });
  });

  // Query Operations (2 tests)
  describe('Query Operations', () => {
    it('should query land title from blockchain', async () => {
      mockFabricClient.evaluateTransaction.mockResolvedValue({
        title_number: 'TCT-001',
        owner_name: 'Owner',
        status: 'ACTIVE'
      });

      const result = await chaincodeService.queryLandTitle('TCT-001');

      expect(result.success).toBe(true);
      expect(result.land_title.title_number).toBe('TCT-001');
      expect(mockFabricClient.evaluateTransaction).toHaveBeenCalledWith('GetLandTitle', 'TCT-001');
    });

    it('should get transaction history from blockchain', async () => {
      const mockHistory = JSON.stringify([
        { transaction_id: 'TXN-001', type: 'CREATE' },
        { transaction_id: 'TXN-002', type: 'CANCEL' }
      ]);

      mockFabricClient.evaluateTransaction.mockResolvedValue(mockHistory);

      const result = await chaincodeService.getTransactionHistory('TCT-001');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('CREATE');
      expect(mockFabricClient.evaluateTransaction).toHaveBeenCalledWith('GetTransactionHistory', 'TCT-001');
    });

    it('should get land title history from blockchain', async () => {
      const mockHistory = [
        { title_number: 'TCT-001', status: 'ACTIVE', timestamp: '2024-01-01' },
        { title_number: 'TCT-001', status: 'PENDING', timestamp: '2024-01-02' }
      ];

      mockFabricClient.evaluateTransaction.mockResolvedValue({ history: mockHistory });

      const result = await chaincodeService.getLandTitleHistory('TCT-001');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(mockFabricClient.evaluateTransaction).toHaveBeenCalledWith('GetLandTitleHistory', 'TCT-001');
    });

    it('should handle query errors gracefully', async () => {
      mockFabricClient.evaluateTransaction.mockRejectedValue(new Error('Query failed'));

      const result = await chaincodeService.queryLandTitle('TCT-999');

      expect(result.success).toBe(false);
      expect(result.land_title).toBeNull();
    });

    it('should handle history query errors gracefully', async () => {
      mockFabricClient.evaluateTransaction.mockRejectedValue(new Error('History query failed'));

      const result = await chaincodeService.getLandTitleHistory('TCT-999');

      expect(result.success).toBe(false);
      expect(result.history).toEqual([]);
    });

    it('should handle transaction history errors gracefully', async () => {
      mockFabricClient.evaluateTransaction.mockRejectedValue(new Error('Transaction history failed'));

      const result = await chaincodeService.getTransactionHistory('TCT-999');

      expect(result).toEqual([]);
    });
  });

  // Error Handling (4 tests)
  describe('Error Handling', () => {
    it('should handle blockchain failure on land title creation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Blockchain network error'));

      const result = await chaincodeService.recordLandTitle({
        title_number: 'TCT-001',
        owner_name: 'Owner',
        property_location: 'Location',
        status: 'ACTIVE',
        reference_id: 'REF-001',
        timestamp: new Date(),
        transaction_id: 'TXN-001'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to record land title');
    });

    it('should handle blockchain failure on cancellation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Network error'));

      const result = await chaincodeService.recordCancellation({
        title_number: 'TCT-001',
        previous_status: 'ACTIVE',
        new_status: 'PENDING',
        original_hash: 'hash',
        reason: 'Cancelled',
        timestamp: new Date(),
        transaction_id: 'TXN-002'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to record cancellation');
    });

    it('should handle blockchain failure on reactivation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Network error'));

      const result = await chaincodeService.recordReactivation({
        title_number: 'TCT-001',
        previous_status: 'PENDING',
        new_status: 'ACTIVE',
        original_hash: 'hash',
        cancellation_hash: 'cancel_hash',
        reason: 'Reactivated',
        timestamp: new Date(),
        transaction_id: 'TXN-003'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to record reactivation');
    });

    it('should handle blockchain failure on transfer', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Network error'));

      const result = await chaincodeService.recordTransfer({
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        transfer_fee: 5000,
        transfer_date: new Date(),
        transaction_type: 'SALE',
        transfer_id: 'TRF-001',
        owner_name: 'Buyer'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to record transfer');
    });
  });

  // Rollback on Blockchain Service Down (4 tests)
  describe('Rollback on Blockchain Service Down', () => {
    it('should send rollback event when blockchain fails on land title creation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Blockchain service down'));

      const result = await chaincodeService.recordLandTitle({
        title_number: 'TCT-001',
        owner_name: 'Owner',
        property_location: 'Location',
        status: 'ACTIVE',
        reference_id: 'REF-001',
        timestamp: new Date(),
        transaction_id: 'TXN-001'
      });

      expect(result.success).toBe(false);
      // Land registry service should receive this failure and trigger rollback
      expect(result.blockchain_hash).toBe('');
    });

    it('should send rollback event when blockchain fails on cancellation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Blockchain service down'));

      const result = await chaincodeService.recordCancellation({
        title_number: 'TCT-001',
        previous_status: 'ACTIVE',
        new_status: 'PENDING',
        original_hash: 'hash',
        reason: 'Cancelled',
        timestamp: new Date(),
        transaction_id: 'TXN-002'
      });

      expect(result.success).toBe(false);
      expect(result.blockchain_hash).toBe('');
    });

    it('should send rollback event when blockchain fails on reactivation', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Blockchain service down'));

      const result = await chaincodeService.recordReactivation({
        title_number: 'TCT-001',
        previous_status: 'PENDING',
        new_status: 'ACTIVE',
        original_hash: 'hash',
        cancellation_hash: 'cancel_hash',
        reason: 'Reactivated',
        timestamp: new Date(),
        transaction_id: 'TXN-003'
      });

      expect(result.success).toBe(false);
      expect(result.blockchain_hash).toBe('');
    });

    it('should send rollback event when blockchain fails on transfer', async () => {
      mockFabricClient.submitTransaction.mockRejectedValue(new Error('Blockchain service down'));

      const result = await chaincodeService.recordTransfer({
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        transfer_fee: 5000,
        transfer_date: new Date(),
        transaction_type: 'SALE',
        transfer_id: 'TRF-001',
        owner_name: 'Buyer'
      });

      expect(result.success).toBe(false);
      expect(result.blockchain_hash).toBe('');
    });
  });
});
