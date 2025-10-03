const express = require('express');
const userService = require('../services/users');
const router = express.Router();

router.get('/validate', async (req, res) => {
  try {
    const { username, email_address } = req.query;

    
    // Check username exists
    const usernameExists = await userService.checkUsernameExists(username);
    if (usernameExists) {
      return res.json({
        valid: false,
        message: 'Username already exists'
      });
    }
    
    // Check email exists
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