const mortgagesController = require('../mortgages');
const mortgagesService = require('../../services/mortgages');

jest.mock('../../services/mortgages');
jest.mock('../../services/publisher');
jest.mock('jsonwebtoken');
jest.mock('../../utils/httpClient');
jest.mock('../../schemas/mortgages');

describe('Mortgages Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1, user_id: 1 }, files: [], headers: { authorization: 'Bearer test' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis(), setHeader: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAllMortgages', () => {
    it('should get all mortgages', async () => {
      const mockResult = { success: true, data: [] };
      mortgagesService.getAllMortgages = jest.fn().mockResolvedValue(mockResult);

      await mortgagesController.getAllMortgages(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      mortgagesService.getAllMortgages = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.getAllMortgages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMortgageById', () => {
    it('should get mortgage by id', async () => {
      req.params.id = '1';
      mortgagesService.getMortgageById = jest.fn().mockResolvedValue({ success: true, data: { id: 1 } });

      await mortgagesController.getMortgageById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mortgagesService.getMortgageById = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.getMortgageById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMortgage', () => {
    it('should create mortgage successfully', async () => {
      const httpClient = require('../../utils/httpClient');
      const rabbitmq = require('../../services/publisher');
      const { mortgageSchema } = require('../../schemas/mortgages');
      
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan Dela Cruz' };
      
      mortgageSchema.parse = jest.fn().mockReturnValue({ land_title_id: 1, bank_name: 'BDO', amount: 50000, owner_name: 'Juan Dela Cruz' });
      httpClient.get = jest.fn().mockResolvedValue({ data: { count: 0, hasPendingTransfer: false } });
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should create mortgage with files', async () => {
      const httpClient = require('../../utils/httpClient');
      const rabbitmq = require('../../services/publisher');
      const { mortgageSchema } = require('../../schemas/mortgages');
      
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan' };
      req.files = [{ originalname: 'test.pdf', mimetype: 'application/pdf', size: 1000, buffer: Buffer.from('test'), fieldname: 'deed' }];
      
      mortgageSchema.parse = jest.fn().mockReturnValue({ land_title_id: 1, bank_name: 'BDO', amount: 50000, owner_name: 'Juan' });
      httpClient.get = jest.fn().mockResolvedValue({ data: { count: 0, hasPendingTransfer: false } });
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should reject when mortgage count is 3', async () => {
      const httpClient = require('../../utils/httpClient');
      const { mortgageSchema } = require('../../schemas/mortgages');
      
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan' };
      
      mortgageSchema.parse = jest.fn().mockReturnValue(req.body);
      httpClient.get = jest.fn().mockResolvedValue({ data: { count: 3, hasPendingTransfer: false } });

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject when has pending transfer', async () => {
      const httpClient = require('../../utils/httpClient');
      const { mortgageSchema } = require('../../schemas/mortgages');
      
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan' };
      
      mortgageSchema.parse = jest.fn().mockReturnValue(req.body);
      httpClient.get = jest.fn().mockResolvedValue({ data: { count: 0, hasPendingTransfer: true, transfer_id: 'T-001' } });

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      const { mortgageSchema } = require('../../schemas/mortgages');
      
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan' };
      
      mortgageSchema.parse = jest.fn().mockImplementation(() => {
        const error = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [{ path: ['amount'], message: 'Invalid amount' }];
        throw error;
      });

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateMortgage', () => {
    it('should update mortgage', async () => {
      req.params.id = '1';
      req.body = { status: 'APPROVED' };
      mortgagesService.updateMortgage = jest.fn().mockResolvedValue({ success: true });

      await mortgagesController.updateMortgage(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      req.body = { status: 'APPROVED' };
      mortgagesService.updateMortgage = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.updateMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancelMortgage', () => {
    it('should cancel mortgage', async () => {
      req.params.id = '1';
      mortgagesService.cancelMortgage = jest.fn().mockResolvedValue({ success: true });

      await mortgagesController.cancelMortgage(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mortgagesService.cancelMortgage = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.cancelMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('releaseMortgage', () => {
    it('should release mortgage', async () => {
      req.params.id = '1';
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await mortgagesController.releaseMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.releaseMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getLandTitlesForMortgage', () => {
    it('should get land titles for mortgage', async () => {
      mortgagesService.getLandTitlesForMortgage = jest.fn().mockResolvedValue({ success: true, data: [] });

      await mortgagesController.getLandTitlesForMortgage(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mortgagesService.getLandTitlesForMortgage = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.getLandTitlesForMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMortgagesForPayment', () => {
    it('should get mortgages for payment', async () => {
      req.query.reference_type = 'mortgage';
      mortgagesService.getMortgagesForPayment = jest.fn().mockResolvedValue({ success: true, data: [] });

      await mortgagesController.getMortgagesForPayment(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.query.reference_type = 'mortgage';
      mortgagesService.getMortgagesForPayment = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.getMortgagesForPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('checkTransferEligibility', () => {
    it('should check transfer eligibility', async () => {
      req.params.id = '1';
      mortgagesService.checkTransferEligibility = jest.fn().mockResolvedValue({ eligible: true });

      await mortgagesController.checkTransferEligibility(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mortgagesService.checkTransferEligibility = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.checkTransferEligibility(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('viewAttachment', () => {
    it('should view attachment with token in header', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline', 'content-length': '1000' }
      });

      await mortgagesController.viewAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should view attachment with token in query', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = 'valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline', 'content-length': '1000' }
      });

      await mortgagesController.viewAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should return 401 if no token', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = undefined;

      await mortgagesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if invalid token', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer invalid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => { throw new Error('Invalid'); });

      await mortgagesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment with token in header', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment', 'content-length': '1000' }
      });

      await mortgagesController.downloadAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should download attachment with token in query', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = 'valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment', 'content-length': '1000' }
      });

      await mortgagesController.downloadAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should return 401 if no token', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = undefined;

      await mortgagesController.downloadAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if invalid token', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer invalid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => { throw new Error('Invalid'); });

      await mortgagesController.downloadAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer valid-token';
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.downloadAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMortgageAttachments', () => {
    it('should get mortgage attachments', async () => {
      req.params.id = '1';
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockResolvedValue({ data: [] });

      await mortgagesController.getMortgageAttachments(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Error'));

      await mortgagesController.getMortgageAttachments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
