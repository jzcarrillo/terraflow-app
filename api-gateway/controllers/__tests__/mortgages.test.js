const mortgagesController = require('../mortgages');
const mortgagesService = require('../../services/mortgages');
const rabbitmq = require('../../services/publisher');
const jwt = require('jsonwebtoken');

jest.mock('../../services/mortgages');
jest.mock('../../services/publisher');
jest.mock('jsonwebtoken');
jest.mock('../../utils/httpClient');

describe('Mortgages Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1, user_id: 1 }, files: [], headers: { authorization: 'Bearer test' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    jest.clearAllMocks();
    rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);
    jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
  });

  describe('createMortgage', () => {
    it('should create mortgage successfully', async () => {
      const httpClient = require('../../utils/httpClient');
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan Dela Cruz' };
      httpClient.get
        .mockResolvedValueOnce({ data: { count: 0 } })
        .mockResolvedValueOnce({ data: { hasPendingTransfer: false } });

      await mortgagesController.createMortgage(req, res);

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_landregistry', expect.objectContaining({
        transaction_id: expect.any(String),
        mortgage_data: expect.objectContaining({
          land_title_id: 1,
          bank_name: 'BDO',
          amount: 50000,
          owner_name: 'Juan Dela Cruz'
        }),
        user_id: 1
      }));
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        transaction_id: expect.any(String)
      }));
    });

    it('should return 400 if mortgage count is already 3', async () => {
      const httpClient = require('../../utils/httpClient');
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan Dela Cruz' };
      httpClient.get
        .mockResolvedValueOnce({ data: { count: 3 } })
        .mockResolvedValueOnce({ data: { hasPendingTransfer: false } });

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Maximum 3 mortgages allowed per land title' });
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });

    it('should return 400 if land title has a pending transfer', async () => {
      const httpClient = require('../../utils/httpClient');
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: '50000', owner_name: 'Juan Dela Cruz' };
      httpClient.get
        .mockResolvedValueOnce({ data: { count: 0 } })
        .mockResolvedValueOnce({ data: { hasPendingTransfer: true, transfer_id: 'TRF-2026-001' } });

      await mortgagesController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot create mortgage. Land title has a pending transfer (TRF-2026-001).' });
      expect(rabbitmq.publishToQueue).not.toHaveBeenCalled();
    });
  });

  describe('getAllMortgages', () => {
    it('should get all mortgages', async () => {
      const mockResult = { success: true, data: [] };
      mortgagesService.getAllMortgages.mockResolvedValue(mockResult);

      await mortgagesController.getAllMortgages(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getMortgageById', () => {
    it('should get mortgage by id', async () => {
      req.params.id = '1';
      const mockResult = { success: true, data: { id: 1 } };
      mortgagesService.getMortgageById.mockResolvedValue(mockResult);

      await mortgagesController.getMortgageById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('cancelMortgage', () => {
    it('should cancel mortgage', async () => {
      req.params.id = '1';
      const mockResult = { success: true };
      mortgagesService.cancelMortgage.mockResolvedValue(mockResult);

      await mortgagesController.cancelMortgage(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('viewAttachment', () => {
    it('should view attachment with valid token', async () => {
      const httpClient = require('../../utils/httpClient');
      
      req.params.documentId = 'doc-123';
      req.query.token = 'valid-token';
      
      const mockStream = { pipe: jest.fn() };
      httpClient.get.mockResolvedValue({
        data: mockStream,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'inline',
          'content-length': '1000'
        }
      });

      await mortgagesController.viewAttachment(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment with valid token', async () => {
      const httpClient = require('../../utils/httpClient');
      
      req.params.documentId = 'doc-123';
      req.query.token = 'valid-token';
      
      const mockStream = { pipe: jest.fn() };
      httpClient.get.mockResolvedValue({
        data: mockStream,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment',
          'content-length': '1000'
        }
      });

      await mortgagesController.downloadAttachment(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });
  });
});
