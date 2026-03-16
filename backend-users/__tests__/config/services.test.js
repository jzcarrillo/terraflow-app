describe('config/services', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default values when env vars are not set', () => {
    // Prevent dotenv from loading .env
    jest.mock('dotenv', () => ({ config: jest.fn() }));

    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.ALLOWED_ORIGINS;

    const config = require('../../config/services');
    expect(config.server.port).toBe(3001);
    expect(config.server.env).toBe('development');
    expect(config.database.host).toBe('localhost');
    expect(config.database.port).toBe(5434);
    expect(config.database.name).toBe('terraflow_users');
    expect(config.database.user).toBe('postgres');
    expect(config.database.password).toBe('password');
    expect(config.jwt.secret).toBe('default-secret-key');
    expect(config.jwt.expiresIn).toBe('24h');
    expect(config.cors.allowedOrigins).toEqual([
      'http://localhost:8081',
      'http://api-gateway-service:8081'
    ]);
  });

  it('should use env values when set', () => {
    jest.mock('dotenv', () => ({ config: jest.fn() }));

    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'mydb';
    process.env.DB_USER = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.JWT_SECRET = 'my-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.ALLOWED_ORIGINS = 'http://app.com,http://admin.com';

    const config = require('../../config/services');
    expect(config.server.port).toBe('4000');
    expect(config.server.env).toBe('production');
    expect(config.database.host).toBe('db.example.com');
    expect(config.database.port).toBe('5432');
    expect(config.database.name).toBe('mydb');
    expect(config.database.user).toBe('admin');
    expect(config.database.password).toBe('secret');
    expect(config.jwt.secret).toBe('my-secret');
    expect(config.jwt.expiresIn).toBe('1h');
    expect(config.cors.allowedOrigins).toEqual(['http://app.com', 'http://admin.com']);
  });
});
