const paymentsController = require('../payments');
const paymentsService = require('../../services/payments');

jest.mock('../../services/payments');
jest.mock('../../services/landtitles');
jest.mock('../../services/publisher');
jest.mock('../../schemas/payments');

describe('Payments Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 }, headers: { authorization: 'Bearer test' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  describe('getAllPayments', () => {
    it('should get all payments', async () => {
      const mockResult = { success: true, data: [] };
      paymentsService.getAllPayments = jest.fn().mockResolvedValue(mockResult);

      await paymentsController.getAllPayments(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      paymentsService.getAllPayments = jest.fn().mockRejectedValue(new Error('Service error'));

      await paymentsController.getAllPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by id', async () => {
      req.params.id = '1';
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ id: 1 });

      await paymentsController.getPaymentById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      paymentsService.getPaymentById = jest.fn().mockRejectedValue(new Error('Not found'));

      await paymentsController.getPaymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPayment', () => {
    it('should create payment for land title', async () => {
      req.body = { land_title_id: 1, reference_type: 'land_title', amount: 1000, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const landtitles = require('../../services/landtitles');
      const payments = require('../../services/payments');
      const rabbitmq = require('../../services/publisher');
      const { paymentSchema } = require('../../schemas/payments');
      
      landtitles.validateLandTitleExists = jest.fn().mockResolvedValue({ exists: true });
      payments.validateLandTitlePayment = jest.fn().mockResolvedValue({ exists: false });
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);
      paymentSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should create payment for mortgage', async () => {
      req.body = { mortgage_id: 1, reference_type: 'mortgage', amount: 1000, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const rabbitmq = require('../../services/publisher');
      const { paymentSchema } = require('../../schemas/payments');
      
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);
      paymentSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should create payment for transfer', async () => {
      req.body = { transfer_id: 1, reference_type: 'Transfer Title', amount: 1000, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const rabbitmq = require('../../services/publisher');
      const { paymentSchema } = require('../../schemas/payments');
      
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);
      paymentSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should return 404 if land title does not exist', async () => {
      req.body = { land_title_id: 999, reference_type: 'land_title', amount: 1000, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const landtitles = require('../../services/landtitles');
      const { paymentSchema } = require('../../schemas/payments');
      
      landtitles.validateLandTitleExists = jest.fn().mockResolvedValue({ exists: false });
      paymentSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if payment already exists', async () => {
      req.body = { land_title_id: 1, reference_type: 'land_title', amount: 1000, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const landtitles = require('../../services/landtitles');
      const payments = require('../../services/payments');
      const { paymentSchema } = require('../../schemas/payments');
      
      landtitles.validateLandTitleExists = jest.fn().mockResolvedValue({ exists: true });
      payments.validateLandTitlePayment = jest.fn().mockResolvedValue({ exists: true });
      paymentSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle validation errors', async () => {
      req.body = { invalid: 'data' };
      req.user = { id: 1, username: 'test' };
      
      const { paymentSchema } = require('../../schemas/payments');
      paymentSchema.parse = jest.fn().mockImplementation(() => { 
        const error = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [];
        throw error;
      });

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('editPayment', () => {
    it('should edit payment', async () => {
      req.params.id = '1';
      req.body = { land_title_id: 1, reference_type: 'land_title', amount: 1500, payment_method: 'Cash', payer_name: 'Test' };
      req.user = { id: 1, username: 'test' };
      
      const rabbitmq = require('../../services/publisher');
      const { paymentEditSchema } = require('../../schemas/payments');
      
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);
      paymentEditSchema.parse = jest.fn().mockReturnValue(req.body);

      await paymentsController.editPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should handle validation errors', async () => {
      req.params.id = '1';
      req.body = { invalid: 'data' };
      req.user = { id: 1, username: 'test' };
      
      const { paymentEditSchema } = require('../../schemas/payments');
      paymentEditSchema.parse = jest.fn().mockImplementation(() => { 
        const error = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [];
        throw error;
      });

      await paymentsController.editPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ payment_id: 'PAY-001' });
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'PENDING' });
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await paymentsController.cancelPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should return 400 if payment already cancelled', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ payment_id: 'PAY-001' });
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'CANCELLED' });

      await paymentsController.cancelPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockRejectedValue(new Error('Service error'));

      await paymentsController.cancelPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ payment_id: 'PAY-001' });
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'PENDING' });
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await paymentsController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should return 400 if payment already paid', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ payment_id: 'PAY-001' });
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'PAID' });

      await paymentsController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if payment is cancelled', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockResolvedValue({ payment_id: 'PAY-001' });
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'CANCELLED' });

      await paymentsController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      req.user = { id: 1, username: 'test' };
      
      paymentsService.getPaymentById = jest.fn().mockRejectedValue(new Error('Service error'));

      await paymentsController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });




  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      req.params.id = '1';
      paymentsService.getPaymentStatus = jest.fn().mockResolvedValue({ status: 'PAID' });

      await paymentsController.getPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      paymentsService.getPaymentStatus = jest.fn().mockRejectedValue(new Error('Error'));

      await paymentsController.getPaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
