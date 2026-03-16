const { userSchema } = require('../users');

describe('Users Schema', () => {
  describe('userSchema', () => {
    it('should validate correct user data', () => {
      const validData = {
        email_address: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        confirm_password: 'password123',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        location: 'Manila',
        role: 'ADMIN'
      };
      
      const result = userSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = userSchema.safeParse({
        email_address: 'invalid',
        username: 'test',
        password: 'pass123',
        confirm_password: 'pass123',
        first_name: 'Test',
        last_name: 'User',
        location: 'Manila',
        role: 'ADMIN'
      });
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const result = userSchema.safeParse({
        email_address: 'test@test.com',
        username: 'test',
        password: 'pass123',
        confirm_password: 'different',
        first_name: 'Test',
        last_name: 'User',
        location: 'Manila',
        role: 'ADMIN'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const result = userSchema.safeParse({
        email_address: 'test@test.com',
        username: 'test',
        password: 'pass123',
        confirm_password: 'pass123',
        first_name: 'Test',
        last_name: 'User',
        location: 'Manila',
        role: 'INVALID'
      });
      expect(result.success).toBe(false);
    });
  });
});
