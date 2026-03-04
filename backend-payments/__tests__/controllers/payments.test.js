const paymentController = require('../../controllers/payments');
const paymentService = require('../../services/payments');

jest.mock('../../services/payments');

describe('Payment Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const mockPayments = [{ id: 1, payment_id: 'PAY-001' }];
      paymentService.getAllPayments.mockResolvedValue(mockPayments);

      await paymentController.getAllPayments(req, res);

      expect(paymentService.getAllPayments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPayments);
    });

    it('should handle errors', async () => {
      paymentService.getAllPayments.mockRejectedValue(new Error('DB error'));

      await paymentController.getAllPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      req.params.id = '1';
      const mockPayment = { id: 1, payment_id: 'PAY-001' };
      paymentService.getPaymentById.mockResolvedValue(mockPayment);

      await paymentController.getPaymentById(req, res);

      expect(paymentService.getPaymentById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockPayment);
    });

    it('should return 404 if payment not found', async () => {
      req.params.id = '999';
      paymentService.getPaymentById.mockResolvedValue(null);

      await paymentController.getPaymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Payment not found' });
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      req.params.id = '1';
      const mockStatus = { id: 1, status: 'PAID' };
      paymentService.getPaymentStatus.mockResolvedValue(mockStatus);

      await paymentController.getPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });

    it('should return 404 if payment not found', async () => {
      req.params.id = '999';
      paymentService.getPaymentStatus.mockResolvedValue(null);

      await paymentController.getPaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validateLandTitlePayment', () => {
    it('should validate land title payment', async () => {
      req.query = { land_title_id: 'TCT-001', reference_type: 'Land Title' };
      paymentService.getExistingPendingPayment.mockResolvedValue({ id: 1 });

      await paymentController.validateLandTitlePayment(req, res);

      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    it('should return 400 if land_title_id missing', async () => {
      req.query = {};

      await paymentController.validateLandTitlePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Land title ID is required' });
    });
  });

  describe('validatePaymentId', () => {
    it('should validate payment id exists', async () => {
      req.params.paymentId = 'PAY-001';
      paymentService.checkPaymentExists.mockResolvedValue(true);

      await paymentController.validatePaymentId(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exists: true,
        message: 'Payment ID already exists'
      });
    });

    it('should validate payment id available', async () => {
      req.params.paymentId = 'PAY-999';
      paymentService.checkPaymentExists.mockResolvedValue(false);

      await paymentController.validatePaymentId(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exists: false,
        message: 'Payment ID is available'
      });
    });
  });
});
