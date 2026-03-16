// Mock axios
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn()
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance)
}));

const transfersController = require('../transfers');

describe('Transfers Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, headers: { authorization: 'Bearer test' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.put.mockReset();
  });

  describe('getAllTransfers', () => {
    it('should get all transfers', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, data: [] } });

      await transfersController.getAllTransfers(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should handle errors with response', async () => {
      mockAxiosInstance.get.mockRejectedValue({ message: 'Service error', response: { status: 500, data: { error: 'Error' } } });

      await transfersController.getAllTransfers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors without response', async () => {
      mockAxiosInstance.get.mockRejectedValue({ message: 'Network error' });

      await transfersController.getAllTransfers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get all transfers' });
    });
  });

  describe('getTransferById', () => {
    it('should get transfer by id', async () => {
      req.params.id = '1';
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, title: 'Test' } });

      await transfersController.getTransferById(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: 1, title: 'Test' });
    });

    it('should handle errors with response', async () => {
      req.params.id = '1';
      mockAxiosInstance.get.mockRejectedValue({ message: 'Not found', response: { status: 404, data: { error: 'Not found' } } });

      await transfersController.getTransferById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors without response', async () => {
      req.params.id = '1';
      mockAxiosInstance.get.mockRejectedValue({ message: 'Network error' });

      await transfersController.getTransferById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTransfer', () => {
    it('should create transfer', async () => {
      req.body = { title_number: 'TCT-001', new_owner: 'Test' };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true, id: 1 } });

      await transfersController.createTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, id: 1 });
    });

    it('should handle errors with response', async () => {
      req.body = { invalid: 'data' };
      mockAxiosInstance.post.mockRejectedValue({ message: 'Validation error', response: { status: 400, data: { error: 'Invalid data' } } });

      await transfersController.createTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors without response', async () => {
      req.body = { title_number: 'TCT-001' };
      mockAxiosInstance.post.mockRejectedValue({ message: 'Network error' });

      await transfersController.createTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('completeTransfer', () => {
    it('should complete transfer', async () => {
      req.params.id = '1';
      req.body = { status: 'completed' };
      mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });

      await transfersController.completeTransfer(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle errors with response', async () => {
      req.params.id = '1';
      req.body = { status: 'completed' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Error', response: { status: 500, data: { error: 'Error' } } });

      await transfersController.completeTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors without response', async () => {
      req.params.id = '1';
      req.body = { status: 'completed' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Network error' });

      await transfersController.completeTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTransfer', () => {
    it('should update transfer', async () => {
      req.params.id = '1';
      req.body = { new_owner: 'Updated Owner' };
      mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });

      await transfersController.updateTransfer(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle errors with response', async () => {
      req.params.id = '1';
      req.body = { new_owner: 'Updated Owner' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Error', response: { status: 500, data: { error: 'Error' } } });

      await transfersController.updateTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors without response', async () => {
      req.params.id = '1';
      req.body = { new_owner: 'Updated Owner' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Network error' });

      await transfersController.updateTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTransferStatus', () => {
    it('should update transfer status', async () => {
      req.params.id = '1';
      req.body = { status: 'approved' };
      mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });

      await transfersController.updateTransferStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle errors with response', async () => {
      req.params.id = '1';
      req.body = { status: 'approved' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Error', response: { status: 500, data: { error: 'Error' } } });

      await transfersController.updateTransferStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors without response', async () => {
      req.params.id = '1';
      req.body = { status: 'approved' };
      mockAxiosInstance.put.mockRejectedValue({ message: 'Network error' });

      await transfersController.updateTransferStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
