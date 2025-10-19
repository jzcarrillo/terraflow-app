const { pool } = require('../config/db');
const { TABLES, STATUS } = require('../config/constants');

class UserService {

  async checkEmailExists(emailAddress) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLES.USERS} WHERE email_address = $1`,
      [emailAddress]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  async checkUsernameExists(username) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLES.USERS} WHERE username = $1`,
      [username]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  async createUser(data) {
    // VALIDATE WITH ZOD FIRST
    const { userSchema } = require('../schemas/users');
    const validatedData = userSchema.parse(data);
    console.log(`✅ Zod validation successful for user: ${validatedData.username}`);
    
    const { 
      email_address, username, password, first_name, last_name, location, role = 'ADMIN',
      transaction_id, status = STATUS.ACTIVE
    } = validatedData;

// USE ALREADY HASHED PASSWORD FROM API GATEWAY 
    const password_hash = password;

    const result = await pool.query(`
      INSERT INTO ${TABLES.USERS} (
        email_address, username, password_hash, first_name, last_name, location, role, transaction_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      email_address, username, password_hash, first_name, last_name, location, role, transaction_id, status
    ]);

    console.log('✅ User creation successfully');
    return result.rows[0];
  }

  async activateUser(userId) {
    const result = await pool.query(`
      UPDATE ${TABLES.USERS} 
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId]);
    
    return result.rows[0];
  }

  async deleteUser(userId) {
    const result = await pool.query(`
      DELETE FROM ${TABLES.USERS} 
      WHERE id = $1
      RETURNING *
    `, [userId]);
    
    return result.rows[0];
  }

  validateRequiredFields(data) {
    const { 
      email_address, username, password, first_name, last_name, location
    } = data;
    
    const requiredFields = {
      email_address,
      username,
      password,
      first_name,
      last_name,
      location
    };
    
    const missingFields = [];
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}

const userService = new UserService();
module.exports = userService;