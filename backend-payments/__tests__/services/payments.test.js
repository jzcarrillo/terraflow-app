const paymentService = require('../../services/payments');
const { executeQuery, findById, updateById } = require('../../utils/database');
const rabbitmq = require('../../utils/rabbitmq');
const { QUEUES, STATUS } = require('../../config/constants');

jest.mock('../../utils/database');
jest.mock('../../utils/rabbitmq');
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishStatusUpdate', () => {
    it('should publish MORTGAGE_PAYMENT_CONFIRMED event for mortgage payments', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-2026-123', reference_type: 'Mortgage',
        reference_id: 'MTG-2026-456', mortgage_id: 'MTG-2026-456', status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID', 'txn-123');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ event_type: 'MORTGAGE_PAYMENT_CONFIRMED' }));
    });

    it('should publish TRANSFER_PAYMENT_CONFIRMED event for transfer payments', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-2026-123', reference_type: 'Transfer Title',
        reference_id: 'TCT-001', transfer_id: 'TRF-2026-789', status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID', 'txn-123');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ event_type: 'TRANSFER_PAYMENT_CONFIRMED' }));
    });

    it('should publish PAYMENT_STATUS_UPDATE event for land title payments', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-2026-123', reference_type: 'Land Title',
        reference_id: 'TCT-001', status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID', 'txn-123');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ event_type: 'PAYMENT_STATUS_UPDATE', status: 'ACTIVE' }));
    });

    it('should publish PENDING status for cancelled land title payment', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'Land Title',
        reference_id: 'TCT-001', status: 'CANCELLED'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'CANCELLED', 'txn-123');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ status: 'PENDING' }));
    });

    it('should handle mortgage payment with lowercase reference_type', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'mortgage',
        reference_id: 'MTG-001', mortgage_id: 'MTG-001', status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ event_type: 'MORTGAGE_PAYMENT_CONFIRMED' }));
    });

    it('should publish MORTGAGE_RELEASE_PAYMENT_CONFIRMED for mortgage_release', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'mortgage_release',
        reference_id: 'MTG-001', status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(QUEUES.LAND_REGISTRY, expect.objectContaining({ event_type: 'MORTGAGE_RELEASE_PAYMENT_CONFIRMED' }));
    });

    it('should not publish transfer event if transfer_id is missing', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'Transfer Title',
        reference_id: 'TCT-001', transfer_id: null, status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID');
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });

    it('should not publish mortgage event if mortgage_id and reference_id are missing', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'Mortgage',
        reference_id: null, mortgage_id: null, status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID');
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });

    it('should not publish mortgage_release event if reference_id is missing', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-001', reference_type: 'mortgage_release',
        reference_id: null, status: 'PAID'
      };
      await paymentService.publishStatusUpdate(mockPayment, 'PAID');
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });
  });

  describe('_buildStatusUpdateQuery', () => {
    it('should build PAID query with userId', async () => {
      const { sql, params } = await paymentService._buildStatusUpdateQuery('PAID', 'user1', 'id');
      expect(sql).toContain('confirmed_by');
      expect(params(1)).toEqual(['PAID', 'user1', 1]);
    });

    it('should build CANCELLED query with userId', async () => {
      const { sql, params } = await paymentService._buildStatusUpdateQuery('CANCELLED', 'user1', 'id');
      expect(sql).toContain('cancelled_by');
      expect(params(1)).toEqual(['CANCELLED', 'user1', 1]);
    });

    it('should build generic query without userId', async () => {
      const { sql, params } = await paymentService._buildStatusUpdateQuery('PENDING', null, 'id');
      expect(sql).not.toContain('confirmed_by');
      expect(params(1)).toEqual(['PENDING', 1]);
    });
  });

  describe('handleLandTitleResponse', () => {
    it('should handle success response', async () => {
      await paymentService.handleLandTitleResponse({ event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS', reference_id: 'TCT-001', new_status: 'ACTIVE' });
    });

    it('should handle failed response', async () => {
      await paymentService.handleLandTitleResponse({ event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED', reference_id: 'TCT-001', error: 'Failed' });
    });
  });

  describe('getPaymentByPaymentId', () => {
    it('should return payment by payment_id', async () => {
      executeQuery.mockResolvedValue({ rows: [{ payment_id: 'PAY-001' }] });
      const result = await paymentService.getPaymentByPaymentId('PAY-001');
      expect(result.payment_id).toBe('PAY-001');
    });
  });

  describe('checkLandTitlePaymentExists with referenceType', () => {
    it('should filter by referenceType when provided', async () => {
      executeQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      const result = await paymentService.checkLandTitlePaymentExists('TCT-001', 'Land Title');
      expect(result).toBe(true);
      expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining('reference_type'), ['TCT-001', 'Land Title']);
    });
  });

  describe('getExistingPendingPayment with referenceType', () => {
    it('should filter by referenceType when provided', async () => {
      executeQuery.mockResolvedValue({ rows: [{ id: 1, status: 'PENDING' }] });
      const result = await paymentService.getExistingPendingPayment('TCT-001', 'Land Title');
      expect(result).toBeDefined();
      expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining('reference_type'), ['TCT-001', 'Land Title']);
    });
  });

  describe('updatePaymentStatusByPaymentId', () => {
    it('should update payment status and publish event', async () => {
      const mockPayment = {
        id: 1, payment_id: 'PAY-2026-123', reference_type: 'Mortgage',
        reference_id: 'MTG-2026-456', mortgage_id: 'MTG-2026-456', status: 'PENDING'
      };
      executeQuery
        .mockResolvedValueOnce({ rows: [mockPayment] })
        .mockResolvedValueOnce({ rows: [{ ...mockPayment, status: 'PAID' }] });

      const result = await paymentService.updatePaymentStatusByPaymentId('PAY-2026-123', 'PAID', 'user1', 'txn-123');
      expect(result.status).toBe('PAID');
    });

    it('should not update if payment is already FAILED', async () => {
      executeQuery.mockResolvedValueOnce({ rows: [{ id: 1, payment_id: 'PAY-001', status: 'FAILED' }] });
      await expect(paymentService.updatePaymentStatusByPaymentId('PAY-001', 'PAID', 'user1')).rejects.toThrow('Cannot update status of a FAILED payment');
    });

    it('should throw if payment not found', async () => {
      executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(paymentService.updatePaymentStatusByPaymentId('PAY-999', 'PAID')).rejects.toThrow('not found');
    });

    it('should not publish if status is not PAID or CANCELLED', async () => {
      const mockPayment = { id: 1, payment_id: 'PAY-001', status: 'PENDING', reference_type: 'Land Title' };
      executeQuery
        .mockResolvedValueOnce({ rows: [mockPayment] })
        .mockResolvedValueOnce({ rows: [{ ...mockPayment, status: 'PROCESSING' }] });

      await paymentService.updatePaymentStatusByPaymentId('PAY-001', 'PROCESSING');
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const mockPayments = [{ id: 1 }, { id: 2 }];
      executeQuery.mockResolvedValue({ rows: mockPayments });

      const result = await paymentService.getAllPayments();

      expect(result).toEqual(mockPayments);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const mockPayment = { id: 1, payment_id: 'PAY-001' };
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(1);

      expect(result).toEqual(mockPayment);
    });
  });

  describe('createPayment', () => {
    it('should create payment', async () => {
      const mockData = {
        payment_id: 'PAY-001',
        reference_type: 'Land Title',
        reference_id: 'TCT-001',
        amount: 5000,
        payer_name: 'John Doe',
        created_by: 'user1'
      };
      executeQuery.mockResolvedValue({ rows: [mockData] });

      const result = await paymentService.createPayment(mockData);

      expect(result.payment_id).toBe('PAY-001');
    });
  });

  describe('updatePayment', () => {
    it('should update payment', async () => {
      const mockPayment = { id: 1, status: 'PENDING' };
      const { findById, updateById } = require('../../utils/database');
      findById.mockResolvedValue(mockPayment);
      updateById.mockResolvedValue({ ...mockPayment, amount: 6000 });

      const result = await paymentService.updatePayment(1, { amount: 6000 });

      expect(result).toBeDefined();
    });

    it('should throw error if payment is FAILED', async () => {
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue({ id: 1, status: 'FAILED' });

      await expect(paymentService.updatePayment(1, { amount: 6000 })).rejects.toThrow('Cannot edit a FAILED payment');
    });

    it('should throw if no fields to update', async () => {
      await expect(paymentService.updatePayment(1, {})).rejects.toThrow('No fields to update');
    });

    it('should throw if payment not found after update', async () => {
      const { findById, updateById } = require('../../utils/database');
      findById.mockResolvedValue({ id: 1, status: 'PENDING' });
      updateById.mockResolvedValue(null);

      await expect(paymentService.updatePayment(1, { amount: 6000 })).rejects.toThrow('not found');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockPayment = { id: 1, status: 'PENDING' };
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue(mockPayment);
      executeQuery.mockResolvedValue({ rows: [{ ...mockPayment, status: 'PAID' }] });

      const result = await paymentService.updatePaymentStatus(1, 'PAID', 'user1');

      expect(result.status).toBe('PAID');
    });

    it('should throw if payment not found', async () => {
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue(null);

      await expect(paymentService.updatePaymentStatus(999, 'PAID')).rejects.toThrow('not found');
    });

    it('should return same payment if status unchanged', async () => {
      const mockPayment = { id: 1, status: 'PAID', reference_type: 'Land Title' };
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue(mockPayment);

      const result = await paymentService.updatePaymentStatus(1, 'PAID', 'user1');
      expect(result.status).toBe('PAID');
    });

    it('should throw if payment is FAILED', async () => {
      const { findById } = require('../../utils/database');
      findById.mockResolvedValue({ id: 1, status: 'FAILED' });

      await expect(paymentService.updatePaymentStatus(1, 'PAID')).rejects.toThrow('Cannot update status of a FAILED payment');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockStatus = { id: 1, status: 'PAID', reference_id: 'TCT-001', updated_at: new Date() };
      executeQuery.mockResolvedValue({ rows: [mockStatus] });

      const result = await paymentService.getPaymentStatus(1);

      expect(result.status).toBe('PAID');
    });
  });

  describe('checkPaymentExists', () => {
    it('should return true if payment exists', async () => {
      executeQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await paymentService.checkPaymentExists('PAY-001');

      expect(result).toBe(true);
    });

    it('should return false if payment does not exist', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await paymentService.checkPaymentExists('PAY-999');

      expect(result).toBe(false);
    });
  });

  describe('checkLandTitlePaymentExists', () => {
    it('should return true if paid payment exists', async () => {
      executeQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await paymentService.checkLandTitlePaymentExists('TCT-001');

      expect(result).toBe(true);
    });

    it('should return false if no paid payment exists', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await paymentService.checkLandTitlePaymentExists('TCT-999');

      expect(result).toBe(false);
    });
  });

  describe('getExistingPendingPayment', () => {
    it('should return pending payment', async () => {
      const mockPayment = { id: 1, status: 'PENDING' };
      executeQuery.mockResolvedValue({ rows: [mockPayment] });

      const result = await paymentService.getExistingPendingPayment('TCT-001');

      expect(result).toEqual(mockPayment);
    });

    it('should return null if no pending payment', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await paymentService.getExistingPendingPayment('TCT-999');

      expect(result).toBeNull();
    });
  });

  describe('rollbackPaymentById', () => {
    it('should rollback payment to FAILED', async () => {
      const mockPayment = { id: 1, payment_id: 'PAY-001', status: 'FAILED' };
      executeQuery.mockResolvedValue({ rows: [mockPayment] });

      const result = await paymentService.rollbackPaymentById(1);

      expect(result.status).toBe('FAILED');
    });

    it('should return null if no payment to rollback', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await paymentService.rollbackPaymentById(999);

      expect(result).toBeNull();
    });
  });

  describe('rollbackPaymentByTitle', () => {
    it('should rollback payment by title', async () => {
      const mockPayment = { id: 1, payment_id: 'PAY-001', status: 'FAILED' };
      executeQuery.mockResolvedValue({ rows: [mockPayment] });

      const result = await paymentService.rollbackPaymentByTitle('TCT-001');

      expect(result.status).toBe('FAILED');
    });

    it('should return null if no payment found', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await paymentService.rollbackPaymentByTitle('TCT-999');

      expect(result).toBeNull();
    });
  });
});
