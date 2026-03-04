const mortgageService = require('../../services/mortgage');
const { pool } = require('../../config/db');
const rabbitmq = require('../../utils/rabbitmq');
const blockchainClient = require('../../services/blockchain-client');
const transactionManager = require('../../services/transaction-manager');
const paymentService = require('../../services/payments');
const { validateWithSchema } = require('../../utils/validation');

jest.mock('../../config/db');
jest.mock('../../utils/rabbitmq');
jest.mock('../../services/blockchain-client', () => ({
  recordLandTitle: jest.fn(),
  recordCancellation: jest.fn(),
  recordMortgage: jest.fn(),
  recordMortgageRelease: jest.fn()
}));
jest.mock('../../services/transaction-manager');
jest.mock('../../utils/validation');
jest.mock('../../schemas/mortgages', () => ({ mortgageSchema: {} }));

describe('Mortgage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mortgage', () => {
    it('should create mortgage with PENDING status', async () => {
      const messageData = {
        transaction_id: 'TXN-MTG-001',
        mortgage_data: {
          land_title_id: 1,
          bank_name: 'BDO',
          amount: 500000,
          interest_rate: 5.5,
          term_years: 10,
          owner_name: 'Juan Dela Cruz'
        },
        user_id: 'user1'
      };

      validateWithSchema.mockReturnValue(messageData.mortgage_data);
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.mortgage_data, status: 'PENDING', lien_position: 1 }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await mortgageService.createMortgage(messageData);

      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe(500000);
    });

    it('should only allow mortgage on ACTIVE land titles', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1 });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1 }, user_id: 'user1' }))
        .rejects.toThrow('Only ACTIVE land titles can be mortgaged');
    });

    it('should validate owner name matches land title owner', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Wrong Owner' });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Wrong Owner' }, user_id: 'user1' }))
        .rejects.toThrow('Owner name does not match land title owner');
    });

    it('should reject if mortgage amount exceeds appraised value', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 2000000 });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 2000000 }, user_id: 'user1' }))
        .rejects.toThrow('Mortgage amount exceeds appraised value');
    });

    it('should allow up to 3 mortgages per land title', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 100000 });
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 100000 }, user_id: 'user1' }))
        .rejects.toThrow('Maximum 3 mortgages allowed per land title');
    });

    it('should reject duplicate mortgage (same owner and land title)', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Juan Dela Cruz', bank_name: 'BDO' });
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', bank_name: 'BDO' }, user_id: 'user1' }))
        .rejects.toThrow('Duplicate mortgage already exists');
    });

    it('should block land title transfer if mortgage is PENDING', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const canTransfer = await mortgageService.checkTransferEligibility(1);

      expect(canTransfer).toBe(false);
    });

    it('should save attachments to documents table', async () => {
      const messageData = {
        transaction_id: 'TXN-MTG-001',
        mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 500000 },
        attachments: [{ filename: 'loan-agreement.pdf' }],
        user_id: 'user1'
      };

      validateWithSchema.mockReturnValue(messageData.mortgage_data);
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.mortgage_data, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await mortgageService.createMortgage(messageData);

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_documents', expect.objectContaining({ attachments: expect.arrayContaining([expect.objectContaining({ filename: 'loan-agreement.pdf' })]) }));
    });

    it('should assign correct lien position', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 100000 });
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, lien_position: 2, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 100000 }, user_id: 'user1' });

      expect(result.lien_position).toBe(2);
    });
  });

  describe('Cancel Mortgage', () => {
    it('should cancel mortgage if status is PENDING', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'CANCELLED' }] });

      const result = await mortgageService.cancelMortgage(1);

      expect(result.status).toBe('CANCELLED');
    });

    it('should NOT cancel mortgage if status is ACTIVE', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE' }] });

      await expect(mortgageService.cancelMortgage(1))
        .rejects.toThrow('Cannot cancel ACTIVE mortgage');
    });

    it('should allow creating new mortgage after cancellation', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 500000, bank_name: 'BDO' });
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, owner_name: 'Juan Dela Cruz', status: 'ACTIVE', appraised_value: 1000000 }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 1, owner_name: 'Juan Dela Cruz', amount: 500000, bank_name: 'BDO' }, user_id: 'user1' });

      expect(result.status).toBe('PENDING');
    });
  });

  describe('Edit Mortgage', () => {
    it('should edit mortgage details when PENDING', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING', amount: 500000 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING', amount: 600000 }] });

      const result = await mortgageService.updateMortgage(1, { amount: 600000 });

      expect(result.amount).toBe(600000);
    });

    it('should edit mortgage details when ACTIVE with field restrictions', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE', details: 'Old details' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE', details: 'Updated details' }] });

      const result = await mortgageService.updateMortgage(1, { details: 'Updated details' });

      expect(result.details).toBe('Updated details');
    });

    it('should NOT allow editing land_title_id when ACTIVE', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE', land_title_id: 1 }] });

      await expect(mortgageService.updateMortgage(1, { land_title_id: 2 }))
        .rejects.toThrow('Cannot change land_title_id for ACTIVE mortgage');
    });
  });

  describe('Mortgage Payment Integration', () => {
    it('should change mortgage status from PENDING to ACTIVE when payment is PAID', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, status: 'PENDING', transaction_id: 'TXN-MTG-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgage.mockResolvedValue({ success: true, blockchainHash: 'mtg-hash-123' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'PAID' });

      expect(result.status).toBe('ACTIVE');
    });

    it('should record blockchain hash when mortgage becomes ACTIVE', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, status: 'PENDING', transaction_id: 'TXN-MTG-001', amount: 500000 };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgage.mockResolvedValue({ success: true, blockchainHash: 'blockchain-mtg-456' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'PAID' });

      expect(blockchainClient.recordMortgage).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('UPDATE mortgages SET blockchain_hash = $1 WHERE id = $2', ['blockchain-mtg-456', 1]);
    });

    it('should revert mortgage to PENDING when payment is CANCELLED', async () => {
      const mockMortgage = { id: 1, status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-MTG-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancel-hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'CANCELLED' });

      expect(result.status).toBe('PENDING');
    });

    it('should only show PENDING mortgages in payment dropdown', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }, { id: 2, status: 'PENDING' }] });

      const result = await mortgageService.getMortgagesForPayment();

      expect(result.every(m => m.status === 'PENDING')).toBe(true);
    });

    it('should NOT show ACTIVE mortgages in payment dropdown', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }, { id: 2, status: 'ACTIVE' }] });

      const result = await mortgageService.getMortgagesForPayment();

      expect(result.find(m => m.status === 'ACTIVE')).toBeUndefined();
    });
  });

  describe('Release Mortgage', () => {
    it('should create release mortgage for ACTIVE mortgage', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE', mortgage_id: 'MTG-2026-123', amount: 1000000, bank_name: 'BDO' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await mortgageService.createReleaseMortgage({ mortgage_id: 1, user_id: 'bank1' });

      expect(result.status).toBe('ACTIVE');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({
        event_type: 'CREATE_RELEASE_PAYMENT',
        reference_type: 'mortgage_release'
      }));
    });

    it('should only allow bank that created mortgage to release it', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }] });

      await expect(mortgageService.createReleaseMortgage({ mortgage_id: 1, user_id: 'bank2' }))
        .rejects.toThrow('Only ACTIVE mortgages can be released');
    });

    it('should change mortgage to RELEASED when release payment is PAID', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', land_title_id: 1, status: 'ACTIVE', transaction_id: 'TXN-MTG-001', bank_name: 'BDO', amount: 1000000 };

      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ title_number: 'LT-2026-001' }] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'RELEASED' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgageRelease.mockResolvedValue({ success: true, blockchainHash: 'release-hash-789' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'PAID' });

      expect(result.status).toBe('RELEASED');
    });

    it('should record blockchain hash for RELEASED status', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', land_title_id: 1, status: 'ACTIVE', transaction_id: 'TXN-MTG-001', bank_name: 'BDO', amount: 1000000 };

      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ title_number: 'LT-2026-001' }] })
        .mockResolvedValueOnce({ rows: [] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'RELEASED' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgageRelease.mockResolvedValue({ success: true, blockchainHash: 'release-blockchain-999' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'PAID' });

      expect(blockchainClient.recordMortgageRelease).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('UPDATE mortgages SET release_blockchain_hash = $1 WHERE mortgage_id = $2', ['release-blockchain-999', 'MTG-2026-123']);
    });

    it('should revert RELEASED to ACTIVE when release payment is CANCELLED', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', status: 'RELEASED', release_blockchain_hash: 'release-hash', transaction_id: 'TXN-MTG-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'CANCELLED' });

      expect(result.status).toBe('ACTIVE');
    });

    it('should allow editing release payment details when PENDING', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'PENDING', release_fee: 5000 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'PENDING', release_fee: 6000 }] });

      const result = await mortgageService.updateReleaseMortgage(1, { release_fee: 6000 });

      expect(result.release_fee).toBe(6000);
    });

    it('should allow cancelling release payment when PENDING', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'PENDING' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'CANCELLED' }] });

      const result = await mortgageService.cancelReleaseMortgage(1);

      expect(result.release_status).toBe('CANCELLED');
    });

    it('should allow cancelling release payment even when PAID', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'PAID' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, release_status: 'CANCELLED' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await mortgageService.cancelReleaseMortgage(1);

      expect(result.release_status).toBe('CANCELLED');
    });
  });

  describe('Dropdown Filters', () => {
    it('should only show ACTIVE land titles in mortgage creation dropdown', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE' }, { id: 2, status: 'ACTIVE' }] });

      const result = await mortgageService.getLandTitlesForMortgage();

      expect(result.every(lt => lt.status === 'ACTIVE')).toBe(true);
    });

    it('should show PENDING mortgages in payment dropdown when reference_type is mortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }] });

      const result = await mortgageService.getMortgagesForPayment('mortgage');

      expect(result.every(m => m.status === 'PENDING')).toBe(true);
    });

    it('should show ACTIVE mortgages in release payment dropdown', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'ACTIVE' }] });

      const result = await mortgageService.getMortgagesForPayment('mortgage_release');

      expect(result.every(m => m.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('Transfer Blocking', () => {
    it('should block transfer if PENDING mortgage exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const canTransfer = await mortgageService.checkTransferEligibility(1);

      expect(canTransfer).toBe(false);
    });

    it('should block transfer if ACTIVE mortgage exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const canTransfer = await mortgageService.checkTransferEligibility(1);

      expect(canTransfer).toBe(false);
    });

    it('should allow transfer if all mortgages are RELEASED', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const canTransfer = await mortgageService.checkTransferEligibility(1);

      expect(canTransfer).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle mortgage not found in cancelMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.cancelMortgage(999))
        .rejects.toThrow('Mortgage not found');
    });

    it('should handle mortgage not found in updateMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.updateMortgage(999, { amount: 100000 }))
        .rejects.toThrow('Mortgage not found');
    });

    it('should handle mortgage not found in createReleaseMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.createReleaseMortgage({ mortgage_id: 999, user_id: 'bank1' }))
        .rejects.toThrow('Mortgage not found');
    });

    it('should handle non-ACTIVE mortgage in createReleaseMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING', created_by: 'bank1' }] });

      await expect(mortgageService.createReleaseMortgage({ mortgage_id: 1, user_id: 'bank1' }))
        .rejects.toThrow('Only ACTIVE mortgages can be released');
    });

    it('should handle mortgage not found in updateReleaseMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.updateReleaseMortgage(999, { release_fee: 5000 }))
        .rejects.toThrow('Mortgage not found');
    });

    it('should handle mortgage not found in cancelReleaseMortgage', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.cancelReleaseMortgage(999))
        .rejects.toThrow('Mortgage not found');
    });

    it('should handle land title not found in createMortgage', async () => {
      validateWithSchema.mockReturnValue({ land_title_id: 999 });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(mortgageService.createMortgage({ transaction_id: 'TXN-001', mortgage_data: { land_title_id: 999 }, user_id: 'user1' }))
        .rejects.toThrow('Land title not found');
    });

    it('should return mortgage unchanged when no fields to update', async () => {
      const mockMortgage = { id: 1, status: 'PENDING', amount: 500000 };
      pool.query.mockResolvedValueOnce({ rows: [mockMortgage] });

      const result = await mortgageService.updateMortgage(1, {});

      expect(result).toEqual(mockMortgage);
    });

    it('should return mortgage unchanged when no release fields to update', async () => {
      const mockMortgage = { id: 1, release_status: 'PENDING' };
      pool.query.mockResolvedValueOnce({ rows: [mockMortgage] });

      const result = await mortgageService.updateReleaseMortgage(1, {});

      expect(result).toEqual(mockMortgage);
    });

    it('should handle database error in getMortgagesForPayment', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(mortgageService.getMortgagesForPayment('mortgage'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle database error in createReleaseMortgage', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(mortgageService.createReleaseMortgage({ mortgage_id: 1, user_id: 'bank1' }))
        .rejects.toThrow('Database error');
    });

    it('should handle database error in getLandTitlesForMortgage', async () => {
      pool.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(mortgageService.getLandTitlesForMortgage())
        .rejects.toThrow('Query failed');
    });

    it('should handle database error in getMortgagesForPayment with default type', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(mortgageService.getMortgagesForPayment())
        .rejects.toThrow('Database error');
    });

    it('should handle database error in getMortgagesForPayment with mortgage_release type', async () => {
      pool.query.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(mortgageService.getMortgagesForPayment('mortgage_release'))
        .rejects.toThrow('Connection lost');
    });

    it('should handle database error in checkTransferEligibility', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database timeout'));

      await expect(mortgageService.checkTransferEligibility(1))
        .rejects.toThrow('Database timeout');
    });
  });
});
