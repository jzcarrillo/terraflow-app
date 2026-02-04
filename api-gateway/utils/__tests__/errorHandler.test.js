const ErrorHandler = require('../errorHandler');

describe('Error Handler', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('handleValidationError', () => {
    it('handles Zod validation errors', () => {
      const zodError = {
        name: 'ZodError',
        errors: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['password'], message: 'Too short' }
        ]
      };

      ErrorHandler.handleValidationError(zodError, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.stringContaining('email')
      });
    });

    it('returns false for non-validation errors', () => {
      const error = { name: 'OtherError' };
      const result = ErrorHandler.handleValidationError(error, mockRes);
      expect(result).toBe(false);
    });
  });

  describe('handleServiceError', () => {
    it('handles RabbitMQ errors', () => {
      const error = new Error('RabbitMQ connection failed');
      ErrorHandler.handleServiceError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Message queue unavailable'
      });
    });

    it('handles backend service errors', () => {
      const error = new Error('Backend service unavailable');
      ErrorHandler.handleServiceError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Backend service unavailable'
      });
    });

    it('handles generic errors', () => {
      const error = new Error('Something went wrong');
      ErrorHandler.handleServiceError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });
});
