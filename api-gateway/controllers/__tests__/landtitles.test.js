const landtitlesController = require('../landtitles');
const landtitlesService = require('../../services/landtitles');

jest.mock('../../services/landtitles');
jest.mock('../../services/redis');
jest.mock('../../services/publisher');
jest.mock('../../utils/tokenHelper');
jest.mock('../../utils/cacheHelper');
jest.mock('../../schemas/landtitles');
jest.mock('../../utils/httpClient');

describe('Land Titles Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 }, files: [], headers: { authorization: 'Bearer test' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis(), setHeader: jest.fn() };
    jest.clearAllMocks();
  });

  describe('createLandTitle', () => {
    it('should return 202 for async land title creation', async () => {
      req.body = { 
        title_number: 'TCT-001', 
        owner_name: 'Test', 
        contact_no: '09171234567',
        email_address: 'test@test.com',
        address: 'Test Address',
        property_location: 'Test Location',
        lot_number: 1, 
        survey_number: 'SN-001',
        area_size: 100, 
        classification: 'Residential',
        registration_date: new Date().toISOString(),
        registrar_office: 'Test Office',
        previous_title_number: 'OCT-001'
      };
      
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue(req.body);
      
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should convert string numbers to proper types', async () => {
      req.body = { 
        title_number: 'TCT-002',
        owner_name: 'Test',
        contact_no: '09171234567',
        email_address: 'test@test.com',
        address: 'Test',
        property_location: 'Test',
        lot_number: '123',
        survey_number: 'SN-001',
        area_size: '456.78',
        classification: 'Residential',
        registration_date: new Date().toISOString(),
        registrar_office: 'Test',
        previous_title_number: 'OCT-001'
      };
      
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue({ ...req.body, lot_number: 123, area_size: 456.78 });
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should handle files with attachments', async () => {
      req.body = { title_number: 'TCT-003', owner_name: 'Test', contact_no: '09171234567', email_address: 'test@test.com', address: 'Test', property_location: 'Test', lot_number: 1, survey_number: 'SN-001', area_size: 100, classification: 'Residential', registration_date: new Date().toISOString(), registrar_office: 'Test', previous_title_number: 'OCT-001' };
      req.files = [{ originalname: 'test.pdf', mimetype: 'application/pdf', size: 1000, buffer: Buffer.from('test'), fieldname: 'deed' }];
      
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue(req.body);
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should handle cache clear failure gracefully', async () => {
      req.body = { title_number: 'TCT-004', owner_name: 'Test', contact_no: '09171234567', email_address: 'test@test.com', address: 'Test', property_location: 'Test', lot_number: 1, survey_number: 'SN-001', area_size: 100, classification: 'Residential', registration_date: new Date().toISOString(), registrar_office: 'Test', previous_title_number: 'OCT-001' };
      
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue(req.body);
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });
      
      const redis = require('../../services/redis');
      redis.clearLandTitlesCache = jest.fn().mockRejectedValue(new Error('Cache error'));
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should handle queue publish failure', async () => {
      req.body = { title_number: 'TCT-005', owner_name: 'Test', contact_no: '09171234567', email_address: 'test@test.com', address: 'Test', property_location: 'Test', lot_number: 1, survey_number: 'SN-001', area_size: 100, classification: 'Residential', registration_date: new Date().toISOString(), registrar_office: 'Test', previous_title_number: 'OCT-001' };
      
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue(req.body);
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockRejectedValue(new Error('Queue error'));

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle duplicate title number', async () => {
      req.body = { title_number: 'TCT-001' };
      const { landTitleSchema } = require('../../schemas/landtitles');
      landTitleSchema.parse = jest.fn().mockReturnValue(req.body);
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: true });

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle validation error in outer catch', async () => {
      req.body = { title_number: 'TCT-006' };
      const { landTitleSchema } = require('../../schemas/landtitles');
      const error = new Error('Validation failed');
      error.name = 'ZodError';
      error.errors = [{ path: ['owner_name'], message: 'Required' }];
      landTitleSchema.parse = jest.fn().mockImplementation(() => { throw error; });

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllLandTitles', () => {
    it('should get all land titles with attachments', async () => {
      const mockData = [{ id: 1, title_number: 'TCT-001' }];
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockResolvedValue({ data: mockData, source: 'database' });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockResolvedValue({ data: [{ id: 1, filename: 'test.pdf' }] });

      await landtitlesController.getAllLandTitles(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle non-array data with nested data property', async () => {
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockResolvedValue({ data: { data: [{ id: 1, title_number: 'TCT-001' }] }, source: 'redis' });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockResolvedValue({ data: [] });

      await landtitlesController.getAllLandTitles(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle attachment fetch errors', async () => {
      const mockData = [{ id: 1, title_number: 'TCT-001' }];
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockResolvedValue({ data: mockData, source: 'database' });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Attachment error'));

      await landtitlesController.getAllLandTitles(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockRejectedValue(new Error('Service error'));

      await landtitlesController.getAllLandTitles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getLandTitle', () => {
    it('should get land title by id with attachments', async () => {
      req.params.id = '1';
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockResolvedValue({ data: { id: 1 }, source: 'database' });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockResolvedValue({ data: [{ id: 1, filename: 'test.pdf' }] });

      await landtitlesController.getLandTitle(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should set empty attachments on fetch error', async () => {
      req.params.id = '1';
      const CacheHelper = require('../../utils/cacheHelper');
      const mockData = { id: 1, title_number: 'TCT-001' };
      CacheHelper.getCachedOrFetch = jest.fn().mockResolvedValue({ data: mockData, source: 'redis' });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Document service down'));

      await landtitlesController.getLandTitle(req, res);

      expect(mockData.attachments).toEqual([]);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      const CacheHelper = require('../../utils/cacheHelper');
      CacheHelper.getCachedOrFetch = jest.fn().mockRejectedValue(new Error('Not found'));

      await landtitlesController.getLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateTitleNumber', () => {
    it('should validate title number', async () => {
      req.params.titleNumber = 'TCT-001';
      landtitlesService.validateTitleNumber = jest.fn().mockResolvedValue({ exists: false });

      await landtitlesController.validateTitleNumber(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.titleNumber = 'TCT-001';
      landtitlesService.validateTitleNumber = jest.fn().mockRejectedValue(new Error('Error'));

      await landtitlesController.validateTitleNumber(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getBlockchainHistory', () => {
    it('should get blockchain history', async () => {
      req.params.titleNumber = 'TCT-001';
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockResolvedValue({ data: [] });

      await landtitlesController.getBlockchainHistory(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.titleNumber = 'TCT-001';
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Error'));

      await landtitlesController.getBlockchainHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment', async () => {
      req.params.documentId = '1';
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment', 'content-length': '1000' }
      });

      await landtitlesController.downloadAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should handle download errors', async () => {
      req.params.documentId = '1';
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('Download error'));

      await landtitlesController.downloadAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('viewAttachment', () => {
    it('should view attachment with token in header', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer validtoken';
      
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ id: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline', 'content-length': '1000' }
      });

      await landtitlesController.viewAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should view attachment with token in query', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = 'validtoken';
      
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ id: 1 });
      
      const httpClient = require('../../utils/httpClient');
      const mockStream = { pipe: jest.fn() };
      httpClient.get = jest.fn().mockResolvedValue({ 
        data: mockStream,
        headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline', 'content-length': '1000' }
      });

      await landtitlesController.viewAttachment(req, res);

      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should return 401 if no token provided', async () => {
      req.params.documentId = '1';
      req.headers.authorization = undefined;
      req.query.token = undefined;

      await landtitlesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if token is invalid', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer invalidtoken';
      
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => { throw new Error('Invalid token'); });

      await landtitlesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle view errors', async () => {
      req.params.documentId = '1';
      req.headers.authorization = 'Bearer validtoken';
      
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ id: 1 });
      
      const httpClient = require('../../utils/httpClient');
      httpClient.get = jest.fn().mockRejectedValue(new Error('View error'));

      await landtitlesController.viewAttachment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

});
