const { pool } = require('../config/db');

const checkTitleExists = async (titleNumber) => {
  try {
    const query = 'SELECT id FROM land_titles WHERE title_number = $1';
    const result = await pool.query(query, [titleNumber]);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`❌ Title validation failed:`, error.message);
    throw error;
  }
};

const validateWithSchema = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    throw error;
  }
};

module.exports = {
  checkTitleExists,
  validateWithSchema
};