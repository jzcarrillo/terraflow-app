const validateWithSchema = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    throw error;
  }
};

const generatePaymentId = () => {
  return `PAY-${new Date().getFullYear()}-${Date.now()}`;
};

module.exports = {
  validateWithSchema,
  generatePaymentId
};