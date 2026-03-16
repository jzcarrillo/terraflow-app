const { handleError } = require('../../utils/errorHandler');

describe('Error Handler', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should return 404 for not found errors', () => {
    handleError(new Error('Resource not found'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found', message: 'Resource not found' });
  });

  it('should return 404 for file not found errors (matches not found branch)', () => {
    handleError(new Error('File not found on disk'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found', message: 'File not found on disk' });
  });

  it('should return 500 for generic errors', () => {
    handleError(new Error('Something broke'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', message: 'Operation failed' });
  });
});
