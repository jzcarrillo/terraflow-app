const { handleError } = require('../../utils/errorHandler');

describe('Error Handler', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should return 400 for ZodError', () => {
    const error = new Error('Validation');
    error.name = 'ZodError';
    error.errors = [{ path: ['amount'], message: 'Required' }];
    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed', details: error.errors });
  });

  it('should return 409 for duplicate entry', () => {
    handleError(new Error('Payment already exists'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 404 for not found', () => {
    handleError(new Error('Payment not found'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 500 for generic error', () => {
    handleError(new Error('Something broke'), res, 'Test');
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
