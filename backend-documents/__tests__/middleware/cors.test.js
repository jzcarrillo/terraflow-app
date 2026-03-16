jest.mock('cors', () => jest.fn(() => 'cors-middleware'));

const cors = require('cors');
const corsMiddleware = require('../../middleware/cors');

describe('CORS Middleware', () => {
  it('should export cors middleware', () => {
    expect(corsMiddleware).toBe('cors-middleware');
  });

  it('should configure cors with correct options', () => {
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
  });
});
