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

const updateById = async (table, id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const query = `
    UPDATE ${table} 
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${fields.length + 1}
    RETURNING *
  `;
  
  const result = await executeQuery(query, [...values, id]);
  return result.rows[0] || null;
};

module.exports = {
  executeQuery,
  findById,
  findByField,
  updateById
};