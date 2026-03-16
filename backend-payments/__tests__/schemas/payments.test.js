const { paymentSchema, paymentEditSchema } = require('../../schemas/payments');

describe('Payment Schemas', () => {
  describe('paymentSchema', () => {
    it('should validate valid land title payment', () => {
      const data = {
        land_title_id: 'TCT-001',
        reference_type: 'Land Title',
        amount: 5000,
        payment_method: 'CASH',
        payer_name: 'John Doe'
      };
      expect(() => paymentSchema.parse(data)).not.toThrow();
    });

    it('should validate valid transfer payment with transfer_id', () => {
      const data = {
        reference_type: 'Transfer Title',
        amount: 5000,
        payment_method: 'CASH',
        payer_name: 'John',
        transfer_id: 'TRF-001'
      };
      expect(() => paymentSchema.parse(data)).not.toThrow();
    });

    it('should reject transfer payment without transfer_id', () => {
      const data = {
        reference_type: 'Transfer Title',
        amount: 5000,
        payment_method: 'CASH',
        payer_name: 'John'
      };
      expect(() => paymentSchema.parse(data)).toThrow();
    });

    it('should validate valid mortgage payment with mortgage_id', () => {
      const data = {
        reference_type: 'mortgage',
        amount: 10000,
        payment_method: 'BANK_TRANSFER',
        payer_name: 'Jane',
        mortgage_id: 'MTG-001'
      };
      expect(() => paymentSchema.parse(data)).not.toThrow();
    });

    it('should reject mortgage payment without mortgage_id', () => {
      const data = {
        reference_type: 'mortgage',
        amount: 10000,
        payment_method: 'BANK_TRANSFER',
        payer_name: 'Jane'
      };
      expect(() => paymentSchema.parse(data)).toThrow();
    });

    it('should reject negative amount', () => {
      const data = {
        reference_type: 'Land Title',
        amount: -100,
        payment_method: 'CASH'
      };
      expect(() => paymentSchema.parse(data)).toThrow();
    });

    it('should reject empty reference_type', () => {
      const data = {
        reference_type: '',
        amount: 5000,
        payment_method: 'CASH'
      };
      expect(() => paymentSchema.parse(data)).toThrow();
    });
  });

  describe('paymentEditSchema', () => {
    it('should validate partial update', () => {
      const data = { amount: '6000' };
      const result = paymentEditSchema.parse(data);
      expect(result.amount).toBe(6000);
    });

    it('should coerce amount string to number', () => {
      const data = { amount: '1234.56' };
      const result = paymentEditSchema.parse(data);
      expect(result.amount).toBe(1234.56);
    });

    it('should validate transfer edit with transfer_id', () => {
      const data = { reference_type: 'Transfer Title', transfer_id: 'TRF-001' };
      expect(() => paymentEditSchema.parse(data)).not.toThrow();
    });

    it('should reject transfer edit without transfer_id', () => {
      const data = { reference_type: 'Transfer Title' };
      expect(() => paymentEditSchema.parse(data)).toThrow();
    });

    it('should validate mortgage edit with mortgage_id', () => {
      const data = { reference_type: 'mortgage', mortgage_id: 'MTG-001' };
      expect(() => paymentEditSchema.parse(data)).not.toThrow();
    });

    it('should reject mortgage edit without mortgage_id', () => {
      const data = { reference_type: 'mortgage' };
      expect(() => paymentEditSchema.parse(data)).toThrow();
    });
  });
});
