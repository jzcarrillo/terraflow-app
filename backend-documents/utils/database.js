const { pool } = require('../config/db');

const executeQuery = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    throw error;
  }
};

const findById = async (table, id) => {
  const query = `SELECT * FROM ${table} WHERE id = $1`;
  const result = await executeQuery(query, [id]);
  return result.rows[0] || null;
};

const findByField = async (table, field, value) => {
  const query = `SELECT * FROM ${table} WHERE ${field} = $1`;
  const result = await executeQuery(query, [value]);
  return result.rows;
};

module.exports = {
  executeQuery,
  findById,
  findByField
};