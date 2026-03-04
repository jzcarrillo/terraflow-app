const transfersController = require('../transfers');

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { success: true, data: { id: 1 } } })
  }))
}));

const axios = require('axios');
const mockAxiosInstance = axios.create();

describe('Transfers Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, headers: { authorization: 'Bearer test' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createTransfer', () => {
    it('should create transfer successfully', async () => {
      await transfersController.createTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAllTransfers', () => {
    it('should get all transfers', async () => {
      await transfersController.getAllTransfers(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
