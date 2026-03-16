const paymentService = require('../../services/payments');
const { pool } = require('../../config/db');
const rabbitmq = require('../../utils/rabbitmq');
const blockchainClient = require('../../services/blockchain-client');
const transactionManager = require('../../services/transaction-manager');

jest.mock('../../config/db');
jest.mock('../../utils/rabbitmq');
jest.mock('../../services/blockchain-client', () => ({
  recordLandTitle: jest.fn(),
  recordCancellation: jest.fn(),
  recordReactivation: jest.fn(),
  recordMortgage: jest.fn(),
  recordMortgageRelease: jest.fn()
}));
jest.mock('../../services/transaction-manager');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic Operations
  describe('Basic Operations', () => {
    it('should create payment successfully', async () => {
      const paymentData = { title_number: 'TCT-001', amount: 5000 };
      const mockResult = { payment_id: 'PAY-001', ...paymentData, status: 'PENDING' };

      transactionManager.executeWithTransaction.mockResolvedValue([mockResult]);

      const result = await paymentService.createPayment(paymentData);

      expect(result.payment_id).toBe('PAY-001');
      expect(result.status).toBe('PENDING');
    });

    it('should execute inner transaction callback for createPayment', async () => {
      const paymentData = { title_number: 'TCT-001', amount: 5000 };

      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ payment_id: 'PAY-001', title_number: 'TCT-001', amount: 5000, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });

      const result = await paymentService.createPayment(paymentData);
      expect(result.payment_id).toBe('PAY-001');
    });

    it('should confirm payment and update status to PAID', async () => {
      const mockPayment = { payment_id: 'PAY-001', title_number: 'TCT-001', amount: 5000, status: 'PENDING' };

      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockPayment, status: 'PAID' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.confirmPayment('PAY-001');

      expect(result.status).toBe('PAID');
    });

    it('should publish event to land registry queue after confirmation', async () => {
      const mockPayment = { payment_id: 'PAY-001', title_number: 'TCT-001', status: 'PAID' };

      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [mockPayment] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.confirmPayment('PAY-001');

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_landregistry', expect.objectContaining({ event_type: 'PAYMENT_CONFIRMED', payment_id: 'PAY-001' }));
    });
  });

  // Status Update Integration (3 tests)
  describe('Status Update Integration', () => {
    it('should update land title status to ACTIVE when payment confirmed', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Location', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'hash123' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(result.status).toBe('ACTIVE');
    });

    it('should trigger blockchain recording when status becomes ACTIVE', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Location', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'blockchain-hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(blockchainClient.recordLandTitle).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET blockchain_hash = $1 WHERE title_number = $2', ['blockchain-hash', 'TCT-001']);
    });

    it('should send success event to payment service after status update', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Location', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS' }));
    });
  });

  // Cancellation Flow (3 tests)
  describe('Cancellation Flow', () => {
    it('should revert land title to PENDING when payment cancelled', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancel-hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'PENDING' });

      expect(result.status).toBe('PENDING');
    });

    it('should record cancellation hash on blockchain', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancellation-hash-123' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'PENDING' });

      expect(blockchainClient.recordCancellation).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE land_titles SET cancellation_hash'), expect.arrayContaining(['cancellation-hash-123']));
    });

    it('should handle rollback when blockchain recording fails', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Location', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockRejectedValue(new Error('Blockchain error'));
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET status = $1 WHERE title_number = $2', ['PENDING', 'TCT-001']);
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'PAYMENT_ROLLBACK_REQUIRED' }));
    });
  });

  // Mortgage Payment Handling (6 tests)
  describe('Mortgage Payment Handling', () => {
    it('should activate mortgage when payment confirmed', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, bank_name: 'Test Bank', amount: 100000, status: 'PENDING', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgage.mockResolvedValue({ success: true, blockchainHash: 'mortgage-hash', transaction_id: 'BC-001' });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'PAID' });

      expect(result.status).toBe('ACTIVE');
      expect(blockchainClient.recordMortgage).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('UPDATE mortgages SET blockchain_hash = $1 WHERE id = $2', ['mortgage-hash', 1]);
    });

    it('should revert mortgage to PENDING when payment cancelled', async () => {
      const mockMortgage = { id: 1, status: 'ACTIVE', blockchain_hash: 'original-hash' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancel-hash' });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'CANCELLED' });

      expect(result.status).toBe('PENDING');
      expect(blockchainClient.recordCancellation).toHaveBeenCalled();
    });

    it('should handle mortgage not found error', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await expect(paymentService.paymentStatusUpdate({ reference_id: 999, reference_type: 'mortgage', status: 'PAID' }))
        .rejects.toThrow('Mortgage not found');
    });

    it('should release mortgage when release payment confirmed', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', land_title_id: 1, status: 'ACTIVE', transaction_id: 'TXN-001', bank_name: 'BDO', amount: 1000000 };

      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ title_number: 'LT-2026-001' }] })
        .mockResolvedValueOnce({ rows: [] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'RELEASED' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgageRelease.mockResolvedValue({ success: true, blockchainHash: 'release-hash', transaction_id: 'BC-002' });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'PAID' });

      expect(result.status).toBe('RELEASED');
      expect(blockchainClient.recordMortgageRelease).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith('UPDATE mortgages SET release_blockchain_hash = $1 WHERE mortgage_id = $2', ['release-hash', 'MTG-2026-123']);
    });

    it('should revert mortgage to ACTIVE when release payment cancelled', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', status: 'RELEASED', release_blockchain_hash: 'release-hash' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'CANCELLED' });

      expect(result.status).toBe('ACTIVE');
    });

    it('should handle blockchain failure gracefully for mortgage', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, bank_name: 'Test Bank', amount: 100000, status: 'PENDING', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgage.mockRejectedValue(new Error('Blockchain error'));

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'PAID' });

      expect(result.status).toBe('ACTIVE');
    });

    it('should handle blockchain failure for mortgage release', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', land_title_id: 1, status: 'ACTIVE', transaction_id: 'TXN-001', bank_name: 'BDO', amount: 1000000 };

      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ title_number: 'LT-2026-001' }] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'RELEASED' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgageRelease.mockRejectedValue(new Error('Blockchain release error'));

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'PAID' });

      expect(result.status).toBe('RELEASED');
    });

    it('should handle blockchain failure for mortgage cancellation', async () => {
      const mockMortgage = { id: 1, status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockRejectedValue(new Error('Cancellation blockchain error'));

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'CANCELLED' });

      expect(result.status).toBe('PENDING');
    });

    it('should handle blockchain failure for release cancellation', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-2026-123', status: 'RELEASED', release_blockchain_hash: 'release-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-2026-123', reference_type: 'mortgage_release', status: 'CANCELLED' });

      expect(result.status).toBe('ACTIVE');
    });
  });

  // Mortgage edge cases
  describe('Mortgage Edge Cases', () => {
    it('should throw when max 3 active mortgages reached', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, status: 'PENDING' };
      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await expect(paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'PAID' }))
        .rejects.toThrow('Maximum 3 active mortgages');
    });

    it('should return currentMortgage for unhandled mortgage status', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, status: 'RELEASED' };
      pool.query.mockResolvedValue({ rows: [mockMortgage] });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 1, reference_type: 'mortgage', status: 'UNKNOWN' });
      expect(result).toEqual(mockMortgage);
    });

    it('should return currentMortgage for unhandled mortgage release status', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-001', status: 'ACTIVE' };
      pool.query.mockResolvedValue({ rows: [mockMortgage] });

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'MTG-001', reference_type: 'mortgage_release', status: 'UNKNOWN' });
      expect(result).toEqual(mockMortgage);
    });
  });

  // Land title blockchain edge cases
  describe('Land Title Blockchain Edge Cases', () => {
    it('should handle invalid land title data in blockchain recording', async () => {
      const mockLandTitle = { id: 1, title_number: null, status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Loc', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, title_number: null, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET status = $1 WHERE title_number = $2', ['PENDING', 'TCT-001']);
    });

    it('should handle blockchain response with success false', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Loc', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: false, message: 'Node unavailable' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET status = $1 WHERE title_number = $2', ['PENDING', 'TCT-001']);
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'PAYMENT_ROLLBACK_REQUIRED' }));
    });

    it('should handle cancellation blockchain failure gracefully', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', blockchain_hash: 'hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockRejectedValue(new Error('Cancellation failed'));
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'PENDING' });

      expect(result.status).toBe('PENDING');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS' }));
    });

    it('should catch outer blockchain processing error', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING', transaction_id: 'TXN-001', owner_name: 'Owner', property_location: 'Loc', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'hash' });
      rabbitmq.publishToQueue.mockRejectedValue(new Error('Queue down'));

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(result.status).toBe('ACTIVE');
    });
  });

  // Publish failure in paymentStatusUpdate
  describe('Publish Failure', () => {
    it('should handle publishToQueue failure when sending failure event', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      rabbitmq.publishToQueue.mockRejectedValue(new Error('Queue down'));

      await expect(paymentService.paymentStatusUpdate({ reference_id: 'TCT-999', status: 'ACTIVE' }))
        .rejects.toThrow('Land title not found');
    });
  });

  // Exported handler functions (lines 509-542)
  describe('Exported Handlers', () => {
    it('processMortgagePaymentConfirmed should handle PAID status', async () => {
      const mockMortgage = { id: 1, land_title_id: 1, bank_name: 'Bank', amount: 100000, status: 'PENDING', transaction_id: 'TXN-001' };
      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgage.mockResolvedValue({ success: true, blockchainHash: 'hash' });

      await paymentService.processMortgagePaymentConfirmed({ mortgage_id: 'MTG-001', payment_status: 'PAID' });

      expect(pool.query).toHaveBeenCalled();
    });

    it('processMortgagePaymentConfirmed should handle CANCELLED status', async () => {
      const mockMortgage = { id: 1, status: 'ACTIVE', blockchain_hash: 'hash' };
      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancel-hash' });

      await paymentService.processMortgagePaymentConfirmed({ reference_id: 'MTG-001', payment_status: 'CANCELLED' });
    });

    it('processMortgagePaymentConfirmed should throw on error', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(paymentService.processMortgagePaymentConfirmed({ mortgage_id: 'MTG-999', payment_status: 'PAID' }))
        .rejects.toThrow('Mortgage not found');
    });

    it('processMortgageReleasePaymentConfirmed should handle PAID status', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-001', land_title_id: 1, status: 'ACTIVE', transaction_id: 'TXN-001', bank_name: 'Bank', amount: 100000 };
      pool.query
        .mockResolvedValueOnce({ rows: [mockMortgage] })
        .mockResolvedValueOnce({ rows: [{ title_number: 'TCT-001' }] })
        .mockResolvedValue({});
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'RELEASED' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordMortgageRelease.mockResolvedValue({ success: true, blockchainHash: 'release-hash' });

      await paymentService.processMortgageReleasePaymentConfirmed({ mortgage_id: 'MTG-001', payment_status: 'PAID' });
    });

    it('processMortgageReleasePaymentConfirmed should handle CANCELLED status', async () => {
      const mockMortgage = { id: 1, mortgage_id: 'MTG-001', status: 'RELEASED' };
      pool.query.mockResolvedValue({ rows: [mockMortgage] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockMortgage, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });

      await paymentService.processMortgageReleasePaymentConfirmed({ reference_id: 'MTG-001', payment_status: 'CANCELLED' });
    });

    it('processMortgageReleasePaymentConfirmed should throw on error', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(paymentService.processMortgageReleasePaymentConfirmed({ mortgage_id: 'MTG-999', payment_status: 'PAID' }))
        .rejects.toThrow('Mortgage not found');
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should send failure event when land title not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await expect(paymentService.paymentStatusUpdate({ reference_id: 'TCT-999', status: 'ACTIVE' }))
        .rejects.toThrow('Land title not found');

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'PAYMENT_STATUS_UPDATE_FAILED' }));
    });

    it('should throw error when payment not found during confirmation', async () => {
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });

      await expect(paymentService.confirmPayment('PAY-999'))
        .rejects.toThrow('Payment not found');
    });

    it('should send failure event when status update fails', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'PENDING' };

      pool.query.mockResolvedValueOnce({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(result).toBeNull();
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED' }));
    });

    it('should rollback reactivation when blockchain fails', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Location', status: 'PENDING', blockchain_hash: 'original-hash', cancellation_hash: 'cancel-hash', transaction_id: 'TXN-001', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordReactivation.mockRejectedValue(new Error('Reactivation blockchain error'));
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET status = $1 WHERE title_number = $2', ['PENDING', 'TCT-001']);
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'PAYMENT_ROLLBACK_REQUIRED', reason: expect.stringContaining('reactivation') }));
    });
  });
});
