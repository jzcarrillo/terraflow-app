const httpClient = require('../httpClient');

describe('HTTP Client', () => {
  it('should be configured with timeout', () => {
    expect(httpClient.defaults.timeout).toBe(5000);
  });

  it('should have JSON content type', () => {
    expect(httpClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have request interceptor', () => {
    expect(httpClient.interceptors.request.handlers.length).toBeGreaterThan(0);
  });

  it('should have response interceptor', () => {
    expect(httpClient.interceptors.response.handlers.length).toBeGreaterThan(0);
  });

  it('should handle request interceptor', () => {
    const config = { url: '/test' };
    const handler = httpClient.interceptors.request.handlers[0];
    const result = handler.fulfilled(config);
    expect(result).toEqual(config);
  });

  it('should handle response error interceptor', async () => {
    const error = new Error('Network error');
    const handler = httpClient.interceptors.response.handlers[0];
    
    await expect(handler.rejected(error)).rejects.toThrow('Network error');
  });
});
