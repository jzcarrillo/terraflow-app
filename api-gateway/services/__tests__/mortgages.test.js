const mortgageService = require('../mortgages');
const httpClient = require('../../utils/httpClient');

jest.mock('../../utils/httpClient');

describe('Mortgage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMortgages', () => {
    it('should get all mortgages', async () => {
      httpClient.get.mockResolvedValue({ data: [{ id: 1 }] });

      const result = await mortgageService.getAllMortgages('token');

      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('getMortgageById', () => {
    it('should get mortgage by id', async () => {
      httpClient.get.mockResolvedValue({ data: { id: 1 } });

      const result = await mortgageService.getMortgageById(1);

      expect(result).toEqual({ data: { id: 1 } });
    });
  });

  describe('createMortgage', () => {
    it('should create mortgage', async () => {
      httpClient.post.mockResolvedValue({ data: { id: 1, status: 'PENDING' } });

      const result = await mortgageService.createMortgage(1, { amount: 500000 }, 'token');

      expect(result).toEqual({ id: 1, status: 'PENDING' });
    });
  });

  describe('updateMortgage', () => {
    it('should update mortgage', async () => {
      httpClient.put.mockResolvedValue({ data: { id: 1, amount: 600000 } });

      const result = await mortgageService.updateMortgage(1, { amount: 600000 }, 'token');

      expect(result).toEqual({ id: 1, amount: 600000 });
    });
  });

  describe('cancelMortgage', () => {
    it('should cancel mortgage', async () => {
      httpClient.delete.mockResolvedValue({ data: { id: 1, status: 'CANCELLED' } });

      const result = await mortgageService.cancelMortgage(1, 'token');

      expect(result).toEqual({ id: 1, status: 'CANCELLED' });
    });
  });

  describe('releaseMortgage', () => {
    it('should release mortgage', async () => {
      httpClient.post.mockResolvedValue({ data: { id: 1, release_status: 'PENDING' } });

      const result = await mortgageService.releaseMortgage(1, 'user1');

      expect(result).toEqual({ id: 1, release_status: 'PENDING' });
    });
  });

  describe('getLandTitlesForMortgage', () => {
    it('should get land titles for mortgage', async () => {
      httpClient.get.mockResolvedValue({ data: [{ id: 1, status: 'ACTIVE' }] });

      const result = await mortgageService.getLandTitlesForMortgage('token');

      expect(result).toEqual([{ id: 1, status: 'ACTIVE' }]);
    });
  });

  describe('getMortgagesForPayment', () => {
    it('should get mortgages for payment', async () => {
      httpClient.get.mockResolvedValue({ data: [{ id: 1, status: 'PENDING' }] });

      const result = await mortgageService.getMortgagesForPayment('mortgage', 'token');

      expect(result).toEqual([{ id: 1, status: 'PENDING' }]);
    });
  });

  describe('checkTransferEligibility', () => {
    it('should check transfer eligibility', async () => {
      httpClient.get.mockResolvedValue({ data: { eligible: true } });

      const result = await mortgageService.checkTransferEligibility(1);

      expect(result).toEqual({ data: { eligible: true } });
    });
  });
});
