const landtitlesController = require('../landtitles');
const landtitlesService = require('../../services/landtitles');
const redis = require('../../services/redis');
const rabbitmq = require('../../services/publisher');

jest.mock('../../services/landtitles', () => ({
  validateTitleNumber: jest.fn(),
  getLandTitles: jest.fn()
}));
jest.mock('../../services/redis', () => ({
  clearLandTitlesCache: jest.fn()
}));
jest.mock('../../services/publisher', () => ({
  publishToQueue: jest.fn()
}));
jest.mock('../../utils/tokenHelper', () => ({
  extractToken: jest.fn(() => 'test-token')
}));
jest.mock('../../utils/cacheHelper', () => ({
  getCachedOrFetch: jest.fn((key, fn) => fn().then(data => ({ data, source: 'database' }))),
  formatResponse: jest.fn((msg, data) => ({ success: true, data }))
}));
jest.mock('../../schemas/landtitles', () => ({
  landTitleSchema: {
    parse: jest.fn((data) => data)
  }
}));
jest.mock('../../utils/httpClient', () => ({
  get: jest.fn().mockResolvedValue({ data: [] })
}));

describe('Land Titles Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 }, files: [], headers: { authorization: 'Bearer test' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createLandTitle', () => {
    it('should return 202 for async land title creation', async () => {
      req.body = { title_number: 'TCT-001', owner_name: 'Test', lot_number: 1, area_size: 100, location: 'Test' };
      landtitlesService.validateTitleNumber.mockResolvedValue({ exists: false });
      rabbitmq.publishToQueue.mockResolvedValue();

      await landtitlesController.createLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('getAllLandTitles', () => {
    it('should get all land titles', async () => {
      const mockData = [{ id: 1, title_number: 'TCT-001' }];
      landtitlesService.getLandTitles.mockResolvedValue({ data: mockData });

      await landtitlesController.getAllLandTitles(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
