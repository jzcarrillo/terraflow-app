jest.mock('cors', () => jest.fn((options) => options));
jest.mock('../../config/services', () => ({
  cors: {
    allowedOrigins: ['http://localhost:8081']
  }
}));

describe('middleware/cors', () => {
  it('should export cors middleware with correct options', () => {
    const corsMiddleware = require('../../middleware/cors');
    expect(corsMiddleware).toEqual({
      origin: ['http://localhost:8081'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });
  });
});
