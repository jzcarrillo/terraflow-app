const paymentService = require('../payments');
const axios = require('axios');

jest.mock('axios');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePaymentId', () => {
    it('should validate payment id', async () => {
      axios.get.mockResolvedValue({ data: { exists: false } });

      const result = await paymentService.validatePaymentId('PAY-001');

      expect(result).toEqual({ exists: false });
    });

    it('should handle errors', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      const result = await paymentService.validatePaymentId('PAY-001');

      expect(result).toEqual({ exists: false, message: 'Payment validation service unavailable' });
    });
  });

  describe('validateLandTitlePayment', () => {
    it('should validate land title payment', async () => {
      axios.get.mockResolvedValue({ data: { exists: false } });

      const result = await paymentService.validateLandTitlePayment('TCT-001', 'Land Title');

      expect(result).toEqual({ exists: false });
    });

    it('should handle errors safely', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      const result = await paymentService.validateLandTitlePayment('TCT-001');

      expect(result).toEqual({ exists: true, message: 'Validation service error - blocking creation for safety' });
    });
  });

  describe('getAllPayments', () => {
    it('should get all payments', async () => {
      const mockPayments = [{ id: 1, payment_id: 'PAY-001' }];
      axios.get.mockResolvedValue({ data: mockPayments });

      const result = await paymentService.getAllPayments('Bearer token');

      expect(axios.get).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: 'Bearer token' } });
      expect(result).toEqual(mockPayments);
    });

    it('should throw error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      await expect(paymentService.getAllPayments('Bearer token')).rejects.toThrow('Service error');
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by id', async () => {
      const mockPayment = { id: 1, payment_id: 'PAY-001' };
      axios.get.mockResolvedValue({ data: mockPayment });

      const result = await paymentService.getPaymentById(1, 'Bearer token');

      expect(result).toEqual(mockPayment);
    });

    it('should throw error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Not found'));

      await expect(paymentService.getPaymentById(999, 'Bearer token')).rejects.toThrow('Not found');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      const mockStatus = { id: 1, status: 'PAID' };
      axios.get.mockResolvedValue({ data: mockStatus });

      const result = await paymentService.getPaymentStatus(1, 'Bearer token');

      expect(result).toEqual(mockStatus);
    });

    it('should throw error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      await expect(paymentService.getPaymentStatus(1, 'Bearer token')).rejects.toThrow('Service error');
    });
  });
});
