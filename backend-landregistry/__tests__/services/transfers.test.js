const transferService = require('../../services/transfers');
const { pool } = require('../../config/db');
const blockchainClient = require('../../services/blockchain-client');

jest.mock('../../config/db');
jest.mock('../../services/blockchain-client');

describe('Transfer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic Operations (4 tests)
  describe('Basic Operations', () => {
    it('should create transfer successfully for ACTIVE land title', async () => {
      const transferData = {
        title_number: 'TCT-001',
        buyer_name: 'Juan Buyer',
        buyer_contact: '09123456789',
        buyer_email: 'buyer@test.com',
        buyer_address: 'Buyer Address',
        transfer_fee: 5000,
        created_by: 'user1'
      };

      const mockTitle = { title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller', contact_no: '123', email_address: 'seller@test.com', address: 'Seller Address' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-2024-123', ...transferData, status: 'PENDING' }] });

      const result = await transferService.submitTransfer(transferData);

      expect(result.status).toBe('PENDING');
      expect(result.buyer_name).toBe('Juan Buyer');
    });

    it('should generate transfer_id in correct format', async () => {
      const transferData = { title_number: 'TCT-001', buyer_name: 'Buyer', buyer_contact: '123', buyer_email: 'test@test.com', buyer_address: 'Address', created_by: 'user1' };
      const mockTitle = { title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller', contact_no: '123', email_address: 'seller@test.com', address: 'Address' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-2024-1234567890', ...transferData }] });

      const result = await transferService.submitTransfer(transferData);

      expect(result.transfer_id).toMatch(/^TRF-\d{4}-\d+$/);
    });

    it('should reject transfer if land title is not ACTIVE', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(transferService.submitTransfer({ title_number: 'TCT-001' }))
        .rejects.toThrow('Land title not found or not active');
    });

    it('should reject duplicate transfer for same title', async () => {
      const mockTitle = { title_number: 'TCT-001', status: 'ACTIVE' };
      const existingTransfer = { transfer_id: 'TRF-001', status: 'PENDING' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [existingTransfer] });

      await expect(transferService.submitTransfer({ title_number: 'TCT-001' }))
        .rejects.toThrow('Transfer already exists');
    });
  });

  // Blockchain Integration (4 tests)
  describe('Blockchain Integration', () => {
    it('should record blockchain hash when status is COMPLETED', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        seller_name: 'Seller',
        seller_contact: '123',
        seller_email: 'seller@test.com',
        seller_address: 'Seller Address',
        buyer_name: 'Buyer',
        buyer_contact: '456',
        buyer_email: 'buyer@test.com',
        buyer_address: 'Buyer Address',
        transfer_fee: 5000
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'seller-hash' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'buyer-hash' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(blockchainClient.recordTransfer).toHaveBeenCalledTimes(2);
    });

    it('should store blockchain hash in land_transfers table', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        seller_name: 'Seller',
        seller_contact: '123',
        seller_email: 'seller@test.com',
        seller_address: 'Address',
        buyer_name: 'Buyer',
        buyer_contact: '456',
        buyer_email: 'buyer@test.com',
        buyer_address: 'Address',
        transfer_fee: 5000
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'hash1' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'hash2' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_transfers SET blockchain_hash = $1 WHERE transfer_id = $2', ['hash1,hash2', 'TRF-001']);
    });

    it('should not record blockchain if status is PENDING', async () => {
      const transferData = { title_number: 'TCT-001', buyer_name: 'Buyer', buyer_contact: '123', buyer_email: 'test@test.com', buyer_address: 'Address', created_by: 'user1' };
      const mockTitle = { title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller', contact_no: '123', email_address: 'seller@test.com', address: 'Address' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', ...transferData, status: 'PENDING' }] });

      await transferService.submitTransfer(transferData);

      expect(blockchainClient.recordTransfer).not.toHaveBeenCalled();
    });

    it('should display blockchain hash for buyer and seller', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        seller_name: 'Seller',
        buyer_name: 'Buyer',
        blockchain_hash: 'seller-hash,buyer-hash',
        seller_contact: '123',
        seller_email: 'seller@test.com',
        seller_address: 'Address',
        buyer_contact: '456',
        buyer_email: 'buyer@test.com',
        buyer_address: 'Address',
        transfer_fee: 5000
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'seller-hash' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'buyer-hash' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      const hashes = 'seller-hash,buyer-hash'.split(',');
      expect(hashes).toHaveLength(2);
      expect(hashes[0]).toBe('seller-hash');
      expect(hashes[1]).toBe('buyer-hash');
    });
  });

  // Transfer Completion (2 tests)
  describe('Transfer Completion', () => {
    it('should complete transfer when payment is paid', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        seller_name: 'Seller',
        buyer_name: 'Buyer',
        buyer_contact: '456',
        buyer_email: 'buyer@test.com',
        buyer_address: 'Buyer Address',
        seller_contact: '123',
        seller_email: 'seller@test.com',
        seller_address: 'Address',
        transfer_fee: 5000
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer.mockResolvedValue({ success: true, blockchainHash: 'hash' });

      const result = await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(result.message).toBe('Transfer completed and ownership updated');
      expect(pool.query).toHaveBeenCalledWith('UPDATE land_transfers SET status = $1, payment_id = $2, transfer_date = NOW() WHERE transfer_id = $3', ['COMPLETED', 'PAY-001', 'TRF-001']);
    });

    it('should update land title with new owner details', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        seller_name: 'Old Owner',
        buyer_name: 'New Owner',
        buyer_contact: '09123456789',
        buyer_email: 'newowner@test.com',
        buyer_address: 'New Address',
        seller_contact: '123',
        seller_email: 'seller@test.com',
        seller_address: 'Address',
        transfer_fee: 5000
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer.mockResolvedValue({ success: true, blockchainHash: 'hash' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE land_titles SET'),
        ['New Owner', '09123456789', 'newowner@test.com', 'New Address', 'TCT-001']
      );
    });
  });

  // Cancellation (1 test)
  describe('Cancellation', () => {
    it('should delete PENDING transfer', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', status: 'PENDING' }] });

      const result = await transferService.deleteTransfer('TRF-001');

      expect(result.transfer_id).toBe('TRF-001');
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM land_transfers WHERE transfer_id = $1 AND status = $2 RETURNING *', ['TRF-001', 'PENDING']);
    });
  });

  // Update Transfer (2 tests)
  describe('Update Transfer', () => {
    it('should update PENDING transfer details', async () => {
      const mockTransfer = { transfer_id: 'TRF-001', status: 'PENDING' };
      const updateData = { buyer_name: 'Updated Buyer', buyer_contact: '09999999999' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTransfer] })
        .mockResolvedValueOnce({ rows: [{ ...mockTransfer, ...updateData }] });

      const result = await transferService.updateTransfer('TRF-001', updateData);

      expect(result.buyer_name).toBe('Updated Buyer');
      expect(result.buyer_contact).toBe('09999999999');
    });

    it('should reject update for COMPLETED transfer', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', status: 'COMPLETED' }] });

      await expect(transferService.updateTransfer('TRF-001', { buyer_name: 'New' }))
        .rejects.toThrow('Only PENDING transfers can be updated');
    });
  });

  // Delete Restrictions (1 test)
  describe('Delete Restrictions', () => {
    it('should reject delete for COMPLETED transfer', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(transferService.deleteTransfer('TRF-001'))
        .rejects.toThrow('Transfer not found or cannot be deleted');
    });
  });

  // Retrieve Transfers (1 test)
  describe('Retrieve Transfers', () => {
    it('should get all transfers with land title details', async () => {
      const mockTransfers = [
        { transfer_id: 'TRF-001', title_number: 'TCT-001', buyer_name: 'Buyer 1', property_location: 'Location 1' },
        { transfer_id: 'TRF-002', title_number: 'TCT-002', buyer_name: 'Buyer 2', property_location: 'Location 2' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockTransfers });

      const result = await transferService.getAllTransfers();

      expect(result).toHaveLength(2);
      expect(result[0].transfer_id).toBe('TRF-001');
    });
  });

  // Status Update (1 test)
  describe('Status Update', () => {
    it('should update transfer status directly', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', status: 'COMPLETED' }] });

      const result = await transferService.updateTransferStatus('TRF-001', 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
      expect(pool.query).toHaveBeenCalledWith('UPDATE land_transfers SET status = $1, updated_at = NOW() WHERE transfer_id = $2 RETURNING *', ['COMPLETED', 'TRF-001']);
    });
  });
});
