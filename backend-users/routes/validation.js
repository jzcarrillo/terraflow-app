const express = require('express');
const { pool } = require('../config/db');
const { TABLES } = require('../config/constants');
const userService = require('../services/users');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET USER BY USERNAME FOR LOGIN (PUBLIC - NEEDED FOR LOGIN)
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('🔍 === GET USER BY USERNAME ===');
    console.log(`📦 Request params: username=${username}`);
    
    const result = await pool.query(
      `SELECT id, username, email_address, password_hash, first_name, last_name, status 
       FROM ${TABLES.USERS} WHERE username = $1`,
      [username]
    );
    
    console.log(`📋 Database query result: ${result.rows.length} rows found`);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found in database: ${username}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    console.log(`✅ User found - ID: ${user.id}, Email: ${user.email_address}, Status: ${user.status}`);
    console.log('📤 Response payload:', JSON.stringify({
      ...user,
      password_hash: '[HIDDEN]'
    }, null, 2));
    
    res.json(user);
    
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// VALIDATE USERNAME / EMAIL ADDRESS IF DUPLICATE
router.get('/validate', async (req, res) => {
  try {
    const { username, email_address } = req.query;

    
// CHECK USERNAME IF EXISTING
    const usernameExists = await userService.checkUsernameExists(username);
    if (usernameExists) {
      return res.json({
        valid: false,
        message: 'Username already exists'
      });
    }
    
// CHECK EMAIL ADDRESS IF EXISTING
    const emailExists = await userService.checkEmailExists(email_address);
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
    console.error('User validation error:', error.message);
    res.status(500).json({ valid: false, error: 'Database validation failed' });
  }
});

module.exports = router;