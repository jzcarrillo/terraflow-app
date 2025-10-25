const { TABLES } = require('../config/constants');
const { checkEmailExists, checkUsernameExists } = require('../utils/validation');
const { executeQuery } = require('../utils/database');
const { handleError } = require('../utils/errorHandler');

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 === GET USER BY USERNAME: ${username}`);
    
    const result = await executeQuery(
      `SELECT id, username, email_address, password_hash, first_name, last_name, role, status 
       FROM ${TABLES.USERS} WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`✅ User found: ${username} (ID: ${result.rows[0].id})`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`❌ Get user error for ${username}:`, error.message);
    handleError(error, res, 'Get user by username');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT id, username, email_address, first_name, last_name, role, status, created_at 
       FROM ${TABLES.USERS} ORDER BY created_at DESC`
    );
    
    res.json({ users: result.rows });
  } catch (error) {
    handleError(error, res, 'Get all users');
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const result = await executeQuery(
      `UPDATE ${TABLES.USERS} SET role = $1 WHERE id = $2 RETURNING *`,
      [role, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    handleError(error, res, 'Update user role');
  }
};

const validateUser = async (req, res) => {
  try {
    const { username, email_address } = req.query;
    
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      return res.json({
        valid: false,
        message: 'Username already exists'
      });
    }
    
    const emailExists = await checkEmailExists(email_address);
    if (emailExists) {
      return res.json({
        valid: false,
        message: 'Email address already exists'
      });
    }
    
    res.json({
      valid: true,
      message: 'User data is valid. No duplicates found.'
    });
  } catch (error) {
    handleError(error, res, 'User validation');
  }
};

module.exports = {
  getUserByUsername,
  getAllUsers,
  updateUserRole,
  validateUser
};