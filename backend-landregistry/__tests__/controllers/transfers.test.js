const transferController = require('../../controllers/transfers');
const transferService = require('../../services/transfers');

jest.mock('../../services/transfers');

describe('Transfer Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('submitTransfer', () => {
    it('should submit transfer', async () => {
      req.body = { title_number: 'TCT-001', new_owner: 'New Owner' };
      const mockTransfer = { id: 1, status: 'PENDING' };
      transferService.submitTransfer.mockResolvedValue(mockTransfer);

      await transferController.submitTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transfer request submitted successfully',
        data: mockTransfer
      });
    });

    it('should handle errors', async () => {
      transferService.submitTransfer.mockRejectedValue(new Error('Validation failed'));

      await transferController.submitTransfer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllTransfers', () => {
    it('should return all transfers', async () => {
      const mockTransfers = [{ id: 1 }];
      transferService.getAllTransfers.mockResolvedValue(mockTransfers);

      await transferController.getAllTransfers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockTransfers
      });
    });
  });

  describe('updateTransferStatus', () => {
    it('should update transfer status', async () => {
      req.params.id = '1';
      req.body.status = 'APPROVED';
      const mockTransfer = { id: 1, status: 'APPROVED' };
      transferService.updateTransferStatus.mockResolvedValue(mockTransfer);

      await transferController.updateTransferStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transfer status updated successfully',
        data: mockTransfer
      });
    });
  });

  describe('updateTransfer', () => {
    it('should update transfer', async () => {
      req.params.id = '1';
      req.body = { new_owner: 'Updated Owner' };
      const mockTransfer = { id: 1, new_owner: 'Updated Owner' };
      transferService.updateTransfer.mockResolvedValue(mockTransfer);

      await transferController.updateTransfer(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transfer updated successfully',
        data: mockTransfer
      });
    });
  });

  describe('deleteTransfer', () => {
    it('should delete transfer', async () => {
      req.params.id = '1';
      const mockTransfer = { id: 1, status: 'DELETED' };
      transferService.deleteTransfer.mockResolvedValue(mockTransfer);

      await transferController.deleteTransfer(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transfer deleted successfully',
        data: mockTransfer
      });
    });
  });
});
