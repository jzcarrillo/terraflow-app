const mortgageController = require('../../controllers/mortgages');
const mortgageService = require('../../services/mortgage');

jest.mock('../../services/mortgage');
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('Mortgage Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: { id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createMortgage', () => {
    it('should create mortgage', async () => {
      req.params.id = '1';
      req.body = { bank_name: 'BDO', amount: 500000 };
      const mockMortgage = { id: 1, status: 'PENDING' };
      mortgageService.createMortgage.mockResolvedValue(mockMortgage);

      await mortgageController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mortgage created successfully',
        data: mockMortgage
      });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mortgageService.createMortgage.mockRejectedValue(new Error('Validation failed'));

      await mortgageController.createMortgage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllMortgages', () => {
    it('should return all mortgages', async () => {
      const { pool } = require('../../config/db');
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await mortgageController.getAllMortgages(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [{ id: 1 }]
      });
    });
  });

  describe('getMortgagesByLandTitle', () => {
    it('should return mortgages by land title', async () => {
      req.params.id = '1';
      const { pool } = require('../../config/db');
      pool.query.mockResolvedValue({ rows: [{ id: 1, land_title_id: 1 }] });

      await mortgageController.getMortgagesByLandTitle(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [{ id: 1, land_title_id: 1 }]
      });
    });
  });

  describe('getMortgageById', () => {
    it('should return mortgage by id', async () => {
      req.params.id = '1';
      const { pool } = require('../../config/db');
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await mortgageController.getMortgageById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 }
      });
    });

    it('should return 404 if not found', async () => {
      req.params.id = '999';
      const { pool } = require('../../config/db');
      pool.query.mockResolvedValue({ rows: [] });

      await mortgageController.getMortgageById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateMortgage', () => {
    it('should update mortgage', async () => {
      req.params.id = '1';
      req.body = { amount: 600000 };
      const mockMortgage = { id: 1, amount: 600000 };
      mortgageService.updateMortgage.mockResolvedValue(mockMortgage);

      await mortgageController.updateMortgage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mortgage updated successfully',
        data: mockMortgage
      });
    });
  });

  describe('cancelMortgage', () => {
    it('should cancel mortgage', async () => {
      req.params.id = '1';
      const mockMortgage = { id: 1, status: 'CANCELLED' };
      mortgageService.cancelMortgage.mockResolvedValue(mockMortgage);

      await mortgageController.cancelMortgage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mortgage cancelled successfully',
        data: mockMortgage
      });
    });
  });

  describe('releaseMortgage', () => {
    it('should release mortgage', async () => {
      req.params.id = '1';
      const mockMortgage = { id: 1, release_status: 'PENDING' };
      mortgageService.createReleaseMortgage.mockResolvedValue(mockMortgage);

      await mortgageController.releaseMortgage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mortgage release initiated',
        data: mockMortgage
      });
    });
  });

  describe('getLandTitlesForMortgage', () => {
    it('should return land titles for mortgage', async () => {
      const mockTitles = [{ id: 1, status: 'ACTIVE' }];
      mortgageService.getLandTitlesForMortgage.mockResolvedValue(mockTitles);

      await mortgageController.getLandTitlesForMortgage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockTitles
      });
    });
  });

  describe('getMortgagesForPayment', () => {
    it('should return mortgages for payment', async () => {
      req.query.reference_type = 'mortgage';
      const mockMortgages = [{ id: 1, status: 'PENDING' }];
      mortgageService.getMortgagesForPayment.mockResolvedValue(mockMortgages);

      await mortgageController.getMortgagesForPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockMortgages
      });
    });
  });

  describe('checkTransferEligibility', () => {
    it('should return eligible true', async () => {
      req.params.id = '1';
      mortgageService.checkTransferEligibility.mockResolvedValue(true);

      await mortgageController.checkTransferEligibility(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        eligible: true,
        message: 'Land title can be transferred'
      });
    });

    it('should return eligible false', async () => {
      req.params.id = '1';
      mortgageService.checkTransferEligibility.mockResolvedValue(false);

      await mortgageController.checkTransferEligibility(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        eligible: false,
        message: 'Land title has active mortgages'
      });
    });
  });
});
