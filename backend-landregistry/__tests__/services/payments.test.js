const paymentService = require('../../services/payments');
const { pool } = require('../../config/db');
const rabbitmq = require('../../utils/rabbitmq');
const blockchainClient = require('../../services/blockchain-client');
const transactionManager = require('../../services/transaction-manager');

jest.mock('../../config/db');
jest.mock('../../utils/rabbitmq');
jest.mock('../../services/blockchain-client');
jest.mock('../../services/transaction-manager');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic Operations (3 tests)
  describe('Basic Operations', () => {
    it('should create payment successfully', async () => {
      const paymentData = { title_number: 'TCT-001', amount: 5000 };
      const mockResult = { payment_id: 'PAY-001', ...paymentData, status: 'PENDING' };

      transactionManager.executeWithTransaction.mockResolvedValue([mockResult]);

      const result = await paymentService.createPayment(paymentData);

      expect(result.payment_id).toBe('PAY-001');
      expect(result.status).toBe('PENDING');
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

  // Error Handling (1 test)
  describe('Error Handling', () => {
    it('should send failure event when land title not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await expect(paymentService.paymentStatusUpdate({ reference_id: 'TCT-999', status: 'ACTIVE' }))
        .rejects.toThrow('Land title not found');

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_payments', expect.objectContaining({ event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED' }));
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
