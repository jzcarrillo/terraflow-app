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
        transfer_fee: 5000,
        created_by: 'user1'
      };

      const mockTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-2024-123', land_title_id: 1, from_owner: 'Seller', to_owner: 'Juan Buyer', status: 'PENDING' }] });

      const result = await transferService.submitTransfer(transferData);

      expect(result.status).toBe('PENDING');
      expect(result.to_owner).toBe('Juan Buyer');
    });

    it('should generate transfer_id in correct format', async () => {
      const transferData = { title_number: 'TCT-001', buyer_name: 'Buyer', created_by: 'user1' };
      const mockTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-2024-1234567890' }] });

      const result = await transferService.submitTransfer(transferData);

      expect(result.transfer_id).toMatch(/^TRF-\d{4}-\d+$/);
    });

    it('should reject transfer if land title is not ACTIVE', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(transferService.submitTransfer({ title_number: 'TCT-001' }))
        .rejects.toThrow('Land title not found or not active');
    });

    it('should reject transfer if active mortgages exist', async () => {
      const mockTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE' };
      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      await expect(transferService.submitTransfer({ title_number: 'TCT-001' }))
        .rejects.toThrow('Cannot transfer land title with active or pending mortgages');
    });

    it('should reject duplicate transfer for same title', async () => {
      const mockTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE' };
      const existingTransfer = { transfer_id: 'TRF-001', status: 'PENDING' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [existingTransfer] });

      await expect(transferService.submitTransfer({ title_number: 'TCT-001' }))
        .rejects.toThrow('Transfer already exists');
    });
  });

  // Blockchain Integration (2 tests - simplified)
  describe('Blockchain Integration', () => {
    it('should not record blockchain during transfer creation', async () => {
      const transferData = { title_number: 'TCT-001', buyer_name: 'Buyer', buyer_contact: '123', buyer_email: 'test@test.com', buyer_address: 'Address', created_by: 'user1' };
      const mockTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', owner_name: 'Seller', contact_no: '123', email_address: 'seller@test.com', address: 'Address' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTitle] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', ...transferData, status: 'PENDING' }] });

      await transferService.submitTransfer(transferData);

      expect(blockchainClient.recordTransfer).not.toHaveBeenCalled();
    });

    it('should record blockchain during payment confirmation', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        land_title_id: 1,
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        consideration_amount: 5000,
        transfer_type: 'SALE'
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'seller-hash-123' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'buyer-hash-456' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      // Should be called twice - once for seller, once for buyer
      expect(blockchainClient.recordTransfer).toHaveBeenCalledTimes(2);
      
      // First call - seller transaction
      expect(blockchainClient.recordTransfer).toHaveBeenNthCalledWith(1, expect.objectContaining({
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        owner_name: 'Seller',
        transfer_fee: '5000',
        transaction_type: 'TRANSFER'
      }));
      
      // Second call - buyer transaction
      expect(blockchainClient.recordTransfer).toHaveBeenNthCalledWith(2, expect.objectContaining({
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        owner_name: 'Buyer',
        transfer_fee: '5000',
        transaction_type: 'TRANSFER'
      }));
    });
  });

  // Transfer Completion (2 tests)
  describe('Transfer Completion', () => {
    it('should complete transfer when payment is paid', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        land_title_id: 1,
        title_number: 'TCT-001',
        from_owner: 'Seller',
        to_owner: 'Buyer',
        consideration_amount: 5000,
        transfer_type: 'SALE'
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'seller-hash-123' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'buyer-hash-456' });

      const result = await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(result.message).toBe('Transfer completed and ownership updated');
      // Should store both hashes joined by comma
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE land_transfers SET blockchain_hash = $1, status = $2, transfer_date = NOW() WHERE transfer_id = $3',
        ['seller-hash-123,buyer-hash-456', 'COMPLETED', 'TRF-001']
      );
    });

    it('should update land title with new owner and contact details', async () => {
      const mockTransfer = {
        transfer_id: 'TRF-001',
        land_title_id: 1,
        title_number: 'TCT-001',
        from_owner: 'Old Owner',
        to_owner: 'New Owner',
        buyer_contact: '09187654321',
        buyer_email: 'newowner@example.com',
        buyer_address: 'New Address',
        consideration_amount: 5000,
        transfer_type: 'SALE'
      };

      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: true, blockchainHash: 'seller-hash-123' })
        .mockResolvedValueOnce({ success: true, blockchainHash: 'buyer-hash-456' });

      await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE land_titles SET'),
        ['New Owner', '09187654321', 'newowner@example.com', 'New Address', 1]
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

    it('should throw on getAllTransfers database error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(transferService.getAllTransfers()).rejects.toThrow('DB connection lost');
    });
  });

  // Status Update (1 test)
  describe('Status Update', () => {
    it('should update transfer status directly', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', status: 'COMPLETED' }] });

      const result = await transferService.updateTransferStatus('TRF-001', 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw if transfer not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(transferService.updateTransferStatus('TRF-999', 'COMPLETED')).rejects.toThrow('Transfer not found');
    });
  });

  describe('Update Transfer', () => {
    it('should update PENDING transfer details', async () => {
      const mockTransfer = { transfer_id: 'TRF-001', status: 'PENDING' };
      const updateData = { buyer_name: 'Updated Buyer', buyer_contact: '09999999999' };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTransfer] })
        .mockResolvedValueOnce({ rows: [{ ...mockTransfer, ...updateData }] });

      const result = await transferService.updateTransfer('TRF-001', updateData);
      expect(result.buyer_name).toBe('Updated Buyer');
    });

    it('should reject update for COMPLETED transfer', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ transfer_id: 'TRF-001', status: 'COMPLETED' }] });
      await expect(transferService.updateTransfer('TRF-001', { buyer_name: 'New' })).rejects.toThrow('Only PENDING transfers can be updated');
    });

    it('should throw if transfer not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(transferService.updateTransfer('TRF-999', {})).rejects.toThrow('Transfer not found');
    });
  });

  describe('processPaymentConfirmed edge cases', () => {
    it('should handle transfer not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-999' })).rejects.toThrow('Transfer not found');
    });

    it('should handle blockchain failure gracefully', async () => {
      const mockTransfer = { transfer_id: 'TRF-001', land_title_id: 1, title_number: 'TCT-001', from_owner: 'Seller', to_owner: 'Buyer', consideration_amount: 5000 };
      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer.mockRejectedValue(new Error('Blockchain down'));

      const result = await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });
      expect(result.message).toBe('Transfer completed and ownership updated');
    });

    it('should handle no blockchain hashes returned', async () => {
      const mockTransfer = { transfer_id: 'TRF-001', land_title_id: 1, title_number: 'TCT-001', from_owner: 'Seller', to_owner: 'Buyer', consideration_amount: 5000 };
      pool.query.mockResolvedValue({ rows: [mockTransfer] });
      blockchainClient.recordTransfer
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: false });

      const result = await transferService.processPaymentConfirmed({ payment_id: 'PAY-001', transfer_id: 'TRF-001' });
      expect(result.message).toBe('Transfer completed and ownership updated');
    });
  });
});
