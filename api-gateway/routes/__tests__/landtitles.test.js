const landtitlesRoutes = require('../landtitles');

describe('Land Titles Routes', () => {
  it('should export router', () => {
    expect(landtitlesRoutes).toBeDefined();
    expect(typeof landtitlesRoutes).toBe('function');
  });
});
