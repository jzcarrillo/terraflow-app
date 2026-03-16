jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('../../config/services', () => ({
  cors: { allowedOrigins: ['http://localhost:3000'] }
}));

describe('CORS Middleware', () => {
  it('should export cors middleware', () => {
    const corsMiddleware = require('../../middleware/cors');
    expect(corsMiddleware).toBe('cors-middleware');
  });

  it('should configure cors with correct options', () => {
    const cors = require('cors');
    expect(cors).toHaveBeenCalledWith({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });
  });
});
