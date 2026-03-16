const { validateWithSchema, generatePaymentId } = require('../../utils/validation');
const { z } = require('zod');

describe('Validation Utils', () => {
  describe('validateWithSchema', () => {
    const schema = z.object({ name: z.string() });

    it('should return parsed data on valid input', () => {
      const result = validateWithSchema(schema, { name: 'test' });
      expect(result.name).toBe('test');
    });

    it('should throw on invalid input', () => {
      expect(() => validateWithSchema(schema, { name: 123 })).toThrow();
    });
  });

  describe('generatePaymentId', () => {
    it('should generate payment id with correct format', () => {
      const id = generatePaymentId();
      expect(id).toMatch(/^PAY-\d{4}-\d+$/);
    });

    it('should include current year', () => {
      const id = generatePaymentId();
      expect(id).toContain(`PAY-${new Date().getFullYear()}`);
    });
  });
});
