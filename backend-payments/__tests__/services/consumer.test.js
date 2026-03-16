jest.mock('../../utils/rabbitmq', () => ({
  publishToQueue: jest.fn().mockResolvedValue(),
  consume: jest.fn().mockResolvedValue()
}));
jest.mock('../../services/payments', () => ({
  checkLandTitlePaymentExists: jest.fn().mockResolvedValue(false),
  getExistingPendingPayment: jest.fn().mockResolvedValue(null),
  checkPaymentExists: jest.fn().mockResolvedValue(false),
  createPayment: jest.fn().mockResolvedValue({}),
  updatePayment: jest.fn().mockResolvedValue({}),
  getPaymentByPaymentId: jest.fn().mockResolvedValue({ reference_id: 'TCT-001', amount: 5000, payer_name: 'John' }),
  updatePaymentStatusByPaymentId: jest.fn().mockResolvedValue({}),
  handleLandTitleResponse: jest.fn().mockResolvedValue(),
  rollbackPaymentByTitle: jest.fn().mockResolvedValue({})
}));
jest.mock('../../utils/validation', () => ({
  validateWithSchema: jest.fn((schema, data) => data),
  generatePaymentId: jest.fn(() => 'PAY-2026-123')
}));
jest.mock('../../schemas/payments', () => ({
  paymentSchema: { parse: jest.fn(d => d) },
  paymentEditSchema: { parse: jest.fn(d => d) }
}));
jest.mock('../../config/constants', () => ({
  QUEUES: { PAYMENTS: 'queue_payments', LAND_REGISTRY: 'queue_landregistry', TRANSFERS: 'queue_transfers' }
}));

const rabbitmq = require('../../utils/rabbitmq');
const paymentService = require('../../services/payments');
const { startConsumer } = require('../../services/consumer');

describe('Consumer Service', () => {
  let messageHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    rabbitmq.consume.mockImplementation(async (queue, handler) => {
      messageHandler = handler;
    });
  });

  it('should start consumer', async () => {
    await startConsumer();
    expect(rabbitmq.consume).toHaveBeenCalledWith('queue_payments', expect.any(Function));
  });

  describe('CREATE_RELEASE_PAYMENT', () => {
    it('should handle CREATE_RELEASE_PAYMENT event with description', async () => {
      await startConsumer();
      await messageHandler({
        event_type: 'CREATE_RELEASE_PAYMENT',
        mortgage_id: 'MTG-001',
        amount: 5000,
        description: 'Release'
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        reference_type: undefined,
      }));
    });

    it('should handle CREATE_RELEASE_PAYMENT without description', async () => {
      await startConsumer();
      await messageHandler({
        event_type: 'CREATE_RELEASE_PAYMENT',
        mortgage_id: 'MTG-002',
        amount: 3000
      });
      expect(paymentService.createPayment).toHaveBeenCalled();
    });
  });

  describe('handlePaymentCreate', () => {
    it('should create payment with payment_data', async () => {
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-001',
        reference_type: 'Land Title',
        payment_data: {
          land_title_id: 'TCT-001',
          reference_type: 'Land Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John'
        }
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        reference_id: 'TCT-001',
        amount: 5000,
        payer_name: 'John'
      }));
    });

    it('should create payment with transfer_id as reference_id', async () => {
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-002',
        reference_type: 'Transfer Title',
        transfer_id: 'TRF-001',
        payment_data: {
          reference_type: 'Transfer Title',
          amount: 8000,
          payment_method: 'GCASH',
          payer_name: 'Jane',
          transfer_id: 'TRF-001'
        }
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        reference_id: 'TRF-001',
        transfer_id: 'TRF-001'
      }));
    });

    it('should create payment with mortgage_id as reference_id', async () => {
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-003',
        reference_type: 'mortgage',
        mortgage_id: 'MTG-001',
        payment_data: {
          reference_type: 'mortgage',
          amount: 10000,
          payment_method: 'BANK_TRANSFER',
          payer_name: 'Bob',
          mortgage_id: 'MTG-001'
        }
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        reference_id: 'MTG-001',
        mortgage_id: 'MTG-001'
      }));
    });

    it('should use messageData.reference_id as fallback', async () => {
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-004',
        reference_type: 'Land Title',
        reference_id: 'REF-FALLBACK',
        username: 'admin',
        payment_id: 'PAY-CUSTOM',
        payment_data: {
          reference_type: 'Land Title',
          amount: 3000,
          payment_method: 'CASH',
          payer_name: 'Fallback User'
        }
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        payment_id: 'PAY-CUSTOM',
        reference_id: 'REF-FALLBACK',
        created_by: 'admin'
      }));
    });

    it('should skip creation if PAID payment exists', async () => {
      paymentService.checkLandTitlePaymentExists.mockResolvedValueOnce(true);
      await startConsumer();
      await expect(messageHandler({
        transaction_id: 'TXN-001',
        reference_type: 'Land Title',
        payment_data: {
          land_title_id: 'TCT-001',
          reference_type: 'Land Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John'
        }
      })).rejects.toThrow('Payment already exists');
    });

    it('should reuse existing PENDING payment', async () => {
      paymentService.getExistingPendingPayment.mockResolvedValueOnce({ payment_id: 'PAY-OLD', confirmed_at: null });
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-001',
        reference_type: 'Land Title',
        payment_data: {
          land_title_id: 'TCT-001',
          reference_type: 'Land Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John'
        }
      });
      expect(paymentService.createPayment).not.toHaveBeenCalled();
    });

    it('should create new payment if pending was previously failed', async () => {
      paymentService.getExistingPendingPayment.mockResolvedValueOnce({ payment_id: 'PAY-OLD', confirmed_at: new Date() });
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-001',
        reference_type: 'Land Title',
        payment_data: {
          land_title_id: 'TCT-001',
          reference_type: 'Land Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John'
        }
      });
      expect(paymentService.createPayment).toHaveBeenCalled();
    });

    it('should skip PAID check for Transfer Title', async () => {
      await startConsumer();
      await messageHandler({
        transaction_id: 'TXN-001',
        reference_type: 'Transfer Title',
        payment_data: {
          land_title_id: 'TCT-001',
          reference_type: 'Transfer Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John',
          transfer_id: 'TRF-001'
        }
      });
      expect(paymentService.checkLandTitlePaymentExists).not.toHaveBeenCalled();
    });

    it('should throw if duplicate payment_id', async () => {
      paymentService.checkPaymentExists.mockResolvedValueOnce(true);
      await startConsumer();
      await expect(messageHandler({
        transaction_id: 'TXN-001',
        payment_data: {
          reference_type: 'Land Title',
          amount: 5000,
          payment_method: 'CASH',
          payer_name: 'John'
        }
      })).rejects.toThrow('already exists');
    });
  });

  describe('UPDATE_PAYMENT', () => {
    it('should handle UPDATE_PAYMENT action', async () => {
      await startConsumer();
      await messageHandler({
        action: 'UPDATE_PAYMENT',
        payment_id: 'PAY-001',
        transaction_id: 'TXN-001',
        payment_data: { amount: 6000 }
      });
      expect(paymentService.updatePayment).toHaveBeenCalledWith('PAY-001', expect.any(Object));
    });

    it('should map land_title_id to reference_id', async () => {
      const { validateWithSchema } = require('../../utils/validation');
      validateWithSchema.mockReturnValueOnce({ land_title_id: 'TCT-001', amount: 5000 });
      await startConsumer();
      await messageHandler({
        action: 'UPDATE_PAYMENT',
        payment_id: 'PAY-001',
        transaction_id: 'TXN-001',
        payment_data: { land_title_id: 'TCT-001', amount: 5000 }
      });
      expect(paymentService.updatePayment).toHaveBeenCalledWith('PAY-001', expect.objectContaining({ reference_id: 'TCT-001', amount: 5000 }));
    });

    it('should map all optional fields including transfer_id and mortgage_id', async () => {
      const { validateWithSchema } = require('../../utils/validation');
      validateWithSchema.mockReturnValueOnce({
        amount: 7000,
        payment_method: 'GCASH',
        payer_name: 'Jane',
        reference_type: 'mortgage',
        land_title_id: 'TCT-002',
        transfer_id: 'TRF-001',
        mortgage_id: 'MTG-001'
      });
      await startConsumer();
      await messageHandler({
        action: 'UPDATE_PAYMENT',
        payment_id: 'PAY-002',
        transaction_id: 'TXN-002',
        payment_data: {}
      });
      expect(paymentService.updatePayment).toHaveBeenCalledWith('PAY-002', expect.objectContaining({
        amount: 7000,
        payment_method: 'GCASH',
        payer_name: 'Jane',
        reference_type: 'mortgage',
        reference_id: 'TCT-002',
        transfer_id: 'TRF-001',
        mortgage_id: 'MTG-001'
      }));
    });
  });

  describe('UPDATE_STATUS', () => {
    it('should handle UPDATE_STATUS action', async () => {
      await startConsumer();
      await messageHandler({
        action: 'UPDATE_STATUS',
        payment_id: 'PAY-001',
        status: 'PAID',
        user_id: 'user1',
        username: 'admin',
        transaction_id: 'TXN-001'
      });
      expect(paymentService.getPaymentByPaymentId).toHaveBeenCalledWith('PAY-001');
      expect(paymentService.updatePaymentStatusByPaymentId).toHaveBeenCalledWith('PAY-001', 'PAID', 'user1', 'TXN-001');
    });

    it('should handle UPDATE_STATUS with no username', async () => {
      paymentService.getPaymentByPaymentId.mockResolvedValueOnce(null);
      await startConsumer();
      await messageHandler({
        action: 'UPDATE_STATUS',
        payment_id: 'PAY-002',
        status: 'CANCELLED',
        user_id: 'user2'
      });
      expect(paymentService.updatePaymentStatusByPaymentId).toHaveBeenCalledWith('PAY-002', 'CANCELLED', 'user2', undefined);
    });
  });

  describe('LAND_TITLE_STATUS_UPDATE', () => {
    it('should handle LAND_TITLE_STATUS_UPDATE_SUCCESS', async () => {
      await startConsumer();
      await messageHandler({
        event_type: 'LAND_TITLE_STATUS_UPDATE_SUCCESS',
        reference_id: 'TCT-001',
        new_status: 'ACTIVE'
      });
      expect(paymentService.handleLandTitleResponse).toHaveBeenCalled();
    });

    it('should handle LAND_TITLE_STATUS_UPDATE_FAILED', async () => {
      await startConsumer();
      await messageHandler({
        event_type: 'LAND_TITLE_STATUS_UPDATE_FAILED',
        reference_id: 'TCT-001',
        error: 'Blockchain failed'
      });
      expect(paymentService.handleLandTitleResponse).toHaveBeenCalled();
    });
  });

  describe('PAYMENT_ROLLBACK_REQUIRED', () => {
    it('should handle rollback', async () => {
      await startConsumer();
      await messageHandler({
        event_type: 'PAYMENT_ROLLBACK_REQUIRED',
        title_number: 'TCT-001',
        reason: 'Blockchain failed'
      });
      expect(paymentService.rollbackPaymentByTitle).toHaveBeenCalledWith('TCT-001');
    });

    it('should handle rollback error gracefully', async () => {
      paymentService.rollbackPaymentByTitle.mockRejectedValueOnce(new Error('Rollback failed'));
      await startConsumer();
      await messageHandler({
        event_type: 'PAYMENT_ROLLBACK_REQUIRED',
        title_number: 'TCT-001',
        reason: 'Blockchain failed'
      });
    });
  });

  describe('startConsumer error', () => {
    it('should retry on consumer start failure', async () => {
      jest.useFakeTimers();
      rabbitmq.consume.mockRejectedValueOnce(new Error('Connection failed'));
      await startConsumer();
      expect(rabbitmq.consume).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
});
