jest.mock('cors', () => {
  return jest.fn((options) => {
    return { corsOptions: options };
  });
});

jest.mock('../../config/services', () => ({
  cors: { allowedOrigins: ['http://localhost:8081'] }
}));

const cors = require('cors');

describe('CORS Middleware', () => {
  let corsMiddleware;

  beforeAll(() => {
    corsMiddleware = require('../../middleware/cors');
  });

  it('should export cors middleware', () => {
    expect(cors).toHaveBeenCalled();
    expect(corsMiddleware).toBeDefined();
  });

  it('should allow requests with no origin', () => {
    const { origin } = corsMiddleware.corsOptions;
    const callback = jest.fn();
    origin(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should allow requests from allowed origins', () => {
    const { origin } = corsMiddleware.corsOptions;
    const callback = jest.fn();
    origin('http://localhost:8081', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should reject requests from disallowed origins', () => {
    const { origin } = corsMiddleware.corsOptions;
    const callback = jest.fn();
    origin('http://evil.com', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });
});
