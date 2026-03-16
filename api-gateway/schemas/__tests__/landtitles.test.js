const { landTitleSchema } = require('../landtitles');

describe('Land Title Schema', () => {
  const validData = {
    owner_name: 'Juan Dela Cruz',
    contact_no: '09171234567',
    email_address: 'juan@test.com',
    title_number: 'TCT-001',
    address: '123 Main St',
    property_location: 'Manila',
    lot_number: 1,
    survey_number: 'SN-001',
    area_size: 100.5,
    classification: 'Residential',
    registration_date: new Date().toISOString(),
    registrar_office: 'Manila Registry',
    previous_title_number: 'OCT-001'
  };

  it('should validate correct land title data', () => {
    const result = landTitleSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid contact number', () => {
    const result = landTitleSchema.safeParse({ ...validData, contact_no: '123' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = landTitleSchema.safeParse({ ...validData, email_address: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid classification', () => {
    const result = landTitleSchema.safeParse({ ...validData, classification: 'Invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject negative lot number', () => {
    const result = landTitleSchema.safeParse({ ...validData, lot_number: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject negative area size', () => {
    const result = landTitleSchema.safeParse({ ...validData, area_size: -1 });
    expect(result.success).toBe(false);
  });
});
