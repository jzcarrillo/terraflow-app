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
      `SELECT id, username, email_address, password_hash, first_name, last_name, role, status 
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

// GET ALL USERS (ADMIN ONLY)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    console.log('👥 === GET ALL USERS ===');
    
    const result = await pool.query(
      `SELECT id, username, email_address, first_name, last_name, role, status, created_at 
       FROM ${TABLES.USERS} ORDER BY created_at DESC`
    );
    
    console.log(`📋 Retrieved ${result.rows.length} users from database`);
    console.log('📤 Response payload:', JSON.stringify(result.rows, null, 2));
    
    res.json({ users: result.rows });
    
  } catch (error) {
    console.error('❌ Get all users error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE USER ROLE (ADMIN ONLY)
router.put('/users/:userId/role', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log(`🔄 === UPDATE USER ROLE ===`);
    console.log(`👤 User ID: ${userId}, New Role: ${role}`);
    
    const result = await pool.query(
      `UPDATE ${TABLES.USERS} SET role = $1 WHERE id = $2 RETURNING *`,
      [role, userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ User role updated successfully`);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Update user role error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// VALIDATE USERNAME / EMAIL ADDRESS IF DUPLICATE
router.get('/validate', async (req, res) => {
  try {
    const { username, email_address } = req.query;
    
    console.log(`🔍 Validating username: ${username}, email: ${email_address}`);
    
// CHECK USERNAME IF EXISTING
    const usernameExists = await userService.checkUsernameExists(username);
    if (usernameExists) {
      console.log(`❌ Username already exists: ${username}`);
      return res.json({
        valid: false,
        message: 'Username already exists'
      });
    }
    
// CHECK EMAIL ADDRESS IF EXISTING
    const emailExists = await userService.checkEmailExists(email_address);
    if (emailExists) {
      console.log(`❌ Email address already exists: ${email_address}`);
      return res.json({
        valid: false,
        message: 'Email address already exists'
      });
    }
    
    console.log(`✅ No duplicates found for username: ${username}, email: ${email_address}`);
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