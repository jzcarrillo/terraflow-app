const paymentsController = require('../payments');
const paymentsService = require('../../services/payments');

jest.mock('../../services/payments', () => ({
  createPayment: jest.fn(),
  getAllPayments: jest.fn()
}));
jest.mock('../../services/landtitles', () => ({
  validateLandTitleExists: jest.fn()
}));
jest.mock('../../services/publisher', () => ({
  publishToQueue: jest.fn()
}));
jest.mock('../../schemas/payments', () => ({
  paymentSchema: {
    parse: jest.fn((data) => data)
  }
}));

describe('Payments Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 }, headers: { authorization: 'Bearer test' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should return 202 for async payment creation', async () => {
      req.body = { land_title_id: 1, reference_type: 'land_title', amount: 1000 };
      req.user = { id: 1, username: 'test' };
      
      const landtitles = require('../../services/landtitles');
      const payments = require('../../services/payments');
      const rabbitmq = require('../../services/publisher');
      
      landtitles.validateLandTitleExists.mockResolvedValue({ exists: true });
      payments.validateLandTitlePayment = jest.fn().mockResolvedValue({ exists: false });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentsController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('getAllPayments', () => {
    it('should get all payments', async () => {
      const mockResult = { success: true, data: [] };
      paymentsService.getAllPayments.mockResolvedValue(mockResult);

      await paymentsController.getAllPayments(req, res);

      expect(paymentsService.getAllPayments).toHaveBeenCalledWith('Bearer test');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
