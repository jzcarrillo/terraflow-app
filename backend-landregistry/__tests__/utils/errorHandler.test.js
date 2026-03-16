const { handleError } = require('../../utils/errorHandler');

describe('Error Handler', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should handle ZodError', () => {
    const error = new Error('Validation');
    error.name = 'ZodError';
    error.errors = [{ path: ['field'], message: 'Required' }];

    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle duplicate entry error', () => {
    handleError(new Error('Record already exists'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle not found error', () => {
    handleError(new Error('Resource not found'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should handle generic error', () => {
    handleError(new Error('Something broke'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
