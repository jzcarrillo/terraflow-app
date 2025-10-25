const { pool } = require('../config/db');
const { TABLES } = require('../config/constants');

const checkEmailExists = async (emailAddress) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLES.USERS} WHERE email_address = $1`,
      [emailAddress]
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Email validation failed:', error.message);
    throw error;
  }
};

const checkUsernameExists = async (username) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLES.USERS} WHERE username = $1`,
      [username]
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Username validation failed:', error.message);
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
  checkEmailExists,
  checkUsernameExists,
  validateWithSchema
};