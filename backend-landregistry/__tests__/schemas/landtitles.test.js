const { landTitleSchema } = require('../../schemas/landtitles');

describe('Land Title Schema', () => {
  const validData = {
    owner_name: 'Juan Dela Cruz',
    contact_no: '09171234567',
    email_address: 'juan@test.com',
    title_number: 'TCT-001',
    address: 'Test Address',
    property_location: 'Test Location',
    lot_number: 1,
    survey_number: 'SN-001',
    area_size: 100,
    classification: 'Residential',
    registration_date: new Date().toISOString(),
    registrar_office: 'Test Office',
    previous_title_number: 'OCT-001'
  };

  it('should validate correct data', () => {
    expect(() => landTitleSchema.parse(validData)).not.toThrow();
  });

  it('should accept optional appraised_value', () => {
    const result = landTitleSchema.parse({ ...validData, appraised_value: 500000 });
    expect(result.appraised_value).toBe(500000);
  });

  it('should reject missing owner_name', () => {
    const { owner_name, ...data } = validData;
    expect(() => landTitleSchema.parse(data)).toThrow();
  });

  it('should reject invalid contact_no', () => {
    expect(() => landTitleSchema.parse({ ...validData, contact_no: '123' })).toThrow();
  });

  it('should reject invalid email', () => {
    expect(() => landTitleSchema.parse({ ...validData, email_address: 'invalid' })).toThrow();
  });

  it('should reject invalid classification', () => {
    expect(() => landTitleSchema.parse({ ...validData, classification: 'Invalid' })).toThrow();
  });

  it('should reject negative area_size', () => {
    expect(() => landTitleSchema.parse({ ...validData, area_size: -1 })).toThrow();
  });

  it('should reject negative lot_number', () => {
    expect(() => landTitleSchema.parse({ ...validData, lot_number: -1 })).toThrow();
  });
});
