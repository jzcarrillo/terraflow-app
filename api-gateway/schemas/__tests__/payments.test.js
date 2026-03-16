const { paymentSchema, paymentEditSchema } = require('../payments');

describe('Payment Schema', () => {
  describe('paymentSchema', () => {
    const validData = {
      land_title_id: '1',
      reference_type: 'land_title',
      amount: 1000,
      payment_method: 'Cash',
      payer_name: 'Juan Dela Cruz'
    };

    it('should validate correct payment data', () => {
      const result = paymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = paymentSchema.safeParse({ ...validData, amount: -100 });
      expect(result.success).toBe(false);
    });

    it('should require transfer_id for Transfer Title', () => {
      const result = paymentSchema.safeParse({ 
        ...validData, 
        reference_type: 'Transfer Title',
        transfer_id: null 
      });
      expect(result.success).toBe(false);
    });

    it('should require mortgage_id for mortgage', () => {
      const result = paymentSchema.safeParse({ 
        ...validData, 
        reference_type: 'mortgage',
        mortgage_id: null 
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid Transfer Title payment', () => {
      const result = paymentSchema.safeParse({ 
        ...validData, 
        reference_type: 'Transfer Title',
        transfer_id: 'T123' 
      });
      expect(result.success).toBe(true);
    });
  });

  describe('paymentEditSchema', () => {
    it('should validate partial payment data', () => {
      const result = paymentEditSchema.safeParse({ amount: 500 });
      expect(result.success).toBe(true);
    });

    it('should coerce amount to number', () => {
      const result = paymentEditSchema.safeParse({ amount: '500' });
      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(500);
    });
  });
});
