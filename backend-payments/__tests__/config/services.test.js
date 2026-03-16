const config = require('../../config/services');

describe('Services Config', () => {
  it('should export server config', () => {
    expect(config.server.port).toBeDefined();
    expect(config.server.env).toBeDefined();
  });

  it('should export database config', () => {
    expect(config.database.host).toBeDefined();
    expect(config.database.port).toBeDefined();
    expect(config.database.name).toBeDefined();
  });

  it('should export rabbitmq config', () => {
    expect(config.rabbitmq.url).toBeDefined();
  });

  it('should export cors config', () => {
    expect(config.cors.allowedOrigins).toBeInstanceOf(Array);
  });

  it('should export jwt config', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
  });
});
