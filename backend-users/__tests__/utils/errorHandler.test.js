const { handleError } = require('../../utils/errorHandler');

describe('utils/errorHandler', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should handle ZodError', () => {
    const error = { name: 'ZodError', message: 'Validation', errors: [{ path: ['email'] }] };
    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed', details: error.errors });
  });

  it('should handle duplicate entry error', () => {
    const error = new Error('Record already exists');
    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate entry', message: 'Record already exists' });
  });

  it('should handle not found error', () => {
    const error = new Error('User not found');
    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found', message: 'User not found' });
  });

  it('should handle generic error', () => {
    const error = new Error('Something broke');
    handleError(error, res, 'Test');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', message: 'Operation failed' });
  });
});
