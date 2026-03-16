const { userSchema } = require('../../schemas/users');

describe('schemas/users', () => {
  const validUser = {
    email_address: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    location: 'Manila'
  };

  it('should validate valid user data', () => {
    const result = userSchema.parse(validUser);
    expect(result.email_address).toBe('test@example.com');
    expect(result.role).toBe('ADMIN');
  });

  it('should default role to ADMIN', () => {
    const result = userSchema.parse(validUser);
    expect(result.role).toBe('ADMIN');
  });

  it('should accept custom role', () => {
    const result = userSchema.parse({ ...validUser, role: 'BANK' });
    expect(result.role).toBe('BANK');
  });

  it('should reject invalid email', () => {
    expect(() => userSchema.parse({ ...validUser, email_address: 'invalid' })).toThrow();
  });

  it('should reject short username', () => {
    expect(() => userSchema.parse({ ...validUser, username: 'ab' })).toThrow();
  });

  it('should reject long username', () => {
    expect(() => userSchema.parse({ ...validUser, username: 'a'.repeat(31) })).toThrow();
  });

  it('should reject short password', () => {
    expect(() => userSchema.parse({ ...validUser, password: '12345' })).toThrow();
  });

  it('should reject empty first_name', () => {
    expect(() => userSchema.parse({ ...validUser, first_name: '' })).toThrow();
  });

  it('should reject empty last_name', () => {
    expect(() => userSchema.parse({ ...validUser, last_name: '' })).toThrow();
  });

  it('should reject empty location', () => {
    expect(() => userSchema.parse({ ...validUser, location: '' })).toThrow();
  });
});
