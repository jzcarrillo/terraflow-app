const corsMiddleware = require('../cors');

describe('CORS Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET' };
    res = { header: jest.fn(), status: jest.fn().mockReturnThis(), end: jest.fn() };
    next = jest.fn();
  });

  it('should set CORS headers', () => {
    corsMiddleware(req, res, next);
    
    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    expect(next).toHaveBeenCalled();
  });

  it('should handle OPTIONS preflight', () => {
    req.method = 'OPTIONS';
    
    corsMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
