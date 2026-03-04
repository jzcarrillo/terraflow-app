const landTitleController = require('../../controllers/landtitles');
const landTitleService = require('../../services/landtitles');
const { checkTitleExists } = require('../../utils/validation');

jest.mock('../../services/landtitles');
jest.mock('../../utils/validation');

describe('Land Title Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllLandTitles', () => {
    it('should return all land titles', async () => {
      const mockTitles = [{ id: 1, title_number: 'TCT-001' }];
      landTitleService.getAllLandTitles.mockResolvedValue(mockTitles);

      await landTitleController.getAllLandTitles(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: mockTitles });
    });

    it('should handle errors', async () => {
      landTitleService.getAllLandTitles.mockRejectedValue(new Error('DB error'));

      await landTitleController.getAllLandTitles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateLandTitleExists', () => {
    it('should validate land title exists', async () => {
      req.query.land_title_id = 'TCT-001';
      checkTitleExists.mockResolvedValue(true);

      await landTitleController.validateLandTitleExists(req, res);

      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    it('should return 400 if land_title_id missing', async () => {
      req.query = {};

      await landTitleController.validateLandTitleExists(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateTitleNumber', () => {
    it('should validate title number exists', async () => {
      req.params.titleNumber = 'TCT-001';
      checkTitleExists.mockResolvedValue(true);

      await landTitleController.validateTitleNumber(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exists: true,
        title_number: 'TCT-001',
        message: 'Title number already exists'
      });
    });

    it('should validate title number available', async () => {
      req.params.titleNumber = 'TCT-999';
      checkTitleExists.mockResolvedValue(false);

      await landTitleController.validateTitleNumber(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exists: false,
        title_number: 'TCT-999',
        message: 'Title number available'
      });
    });
  });

  describe('getLandTitleById', () => {
    it('should return land title by id', async () => {
      req.params.id = '1';
      const mockTitle = { id: 1, title_number: 'TCT-001' };
      landTitleService.getLandTitleById.mockResolvedValue(mockTitle);

      await landTitleController.getLandTitleById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTitle });
    });

    it('should return 404 if not found', async () => {
      req.params.id = '999';
      landTitleService.getLandTitleById.mockResolvedValue(null);

      await landTitleController.getLandTitleById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
