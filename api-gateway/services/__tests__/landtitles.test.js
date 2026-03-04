const landTitleService = require('../landtitles');
const httpClient = require('../../utils/httpClient');

jest.mock('../../utils/httpClient');

describe('LandTitle Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLandTitles', () => {
    it('should get all land titles', async () => {
      const mockData = { data: [{ id: 1, title_number: 'TCT-001' }] };
      httpClient.get.mockResolvedValue(mockData);

      const result = await landTitleService.getLandTitles('token');

      expect(httpClient.get).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: 'Bearer token' } });
      expect(result).toEqual(mockData);
    });

    it('should work without token', async () => {
      httpClient.get.mockResolvedValue({ data: [] });

      await landTitleService.getLandTitles();

      expect(httpClient.get).toHaveBeenCalledWith(expect.any(String), { headers: {} });
    });
  });

  describe('getLandTitle', () => {
    it('should get land title by id', async () => {
      const mockData = { data: { id: 1, title_number: 'TCT-001' } };
      httpClient.get.mockResolvedValue(mockData);

      const result = await landTitleService.getLandTitle(1, 'token');

      expect(result).toEqual(mockData);
    });
  });

  describe('validateTitleNumber', () => {
    it('should validate title number', async () => {
      const mockData = { data: { exists: false } };
      httpClient.get.mockResolvedValue(mockData);

      const result = await landTitleService.validateTitleNumber('TCT-001', 'token');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('validateLandTitleExists', () => {
    it('should validate land title exists', async () => {
      const mockData = { data: { exists: true } };
      httpClient.get.mockResolvedValue(mockData);

      const result = await landTitleService.validateLandTitleExists('TCT-001');

      expect(result).toEqual({ exists: true });
    });

    it('should handle errors gracefully', async () => {
      httpClient.get.mockRejectedValue(new Error('Service unavailable'));

      const result = await landTitleService.validateLandTitleExists('TCT-001');

      expect(result).toEqual({ exists: false, message: 'Land title validation service unavailable' });
    });
  });
});
