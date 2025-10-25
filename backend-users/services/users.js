const { pool } = require('../config/db');
const { TABLES, STATUS } = require('../config/constants');
const { validateWithSchema } = require('../utils/validation');

class UserService {

  async createUser(data) {
    const { userSchema } = require('../schemas/users');
    const validatedData = validateWithSchema(userSchema, data);
    
    const { 
      email_address, username, password, first_name, last_name, location, role = 'ADMIN',
      transaction_id, status = STATUS.ACTIVE
    } = validatedData;

    const password_hash = password;

    const result = await pool.query(`
      INSERT INTO ${TABLES.USERS} (
        email_address, username, password_hash, first_name, last_name, location, role, transaction_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      email_address, username, password_hash, first_name, last_name, location, role, transaction_id, status
    ]);

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


}

const userService = new UserService();
module.exports = userService;