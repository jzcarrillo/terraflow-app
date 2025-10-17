const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/services');
const rabbitmq = require('../services/publisher');
const users = require('../services/users');
const { userSchema } = require('../schemas/users');
const { QUEUES, STATUS } = require('../config/constants');

// VALIDATE USER - CHECK DUPLICATES
const validateUser = async (req, res) => {
  try {
    const { username, email_address } = req.query;
    console.log(`🔍 Validating user: ${username}, ${email_address}`);
    
    const response = await users.validateUser(username, email_address);
    
    console.log(`✅ User validation: ${response.valid ? 'No duplicates found' : 'Duplicates detected'}`);
    res.json(response);
  } catch (error) {
    console.error('❌ User validation service error:', error.message);
    res.status(500).json({ valid: false, message: 'User validation service unavailable' });
  }
};

// CREATE USER
const createUser = async (req, res) => {

// CORRELATION ID 
  const transactionId = require('crypto').randomUUID();
  
  try {


// VALIDATE REQUEST USING ZOD
    const validatedData = userSchema.parse(req.body);
    console.log('✅ Zod validation successful for user:', validatedData.username);

// CHECK FOR DUPLICATE EMAIL/USERNAME
    const duplicateCheck = await users.validateUser(validatedData.username, validatedData.email_address);
    
    if (!duplicateCheck.valid) {
      console.log(`❌ Duplicate validation failed: ${duplicateCheck.message}`);
      return res.status(409).json({
        error: 'Duplicate user data',
        message: duplicateCheck.message
      });
    }
    
    console.log('✅ No duplicates found, proceeding with user creation');

// HASH PASSWORDS FOR SECURITY
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const hashedConfirmPassword = await bcrypt.hash(validatedData.confirm_password, 10);

// LOG REQUEST PAYLOAD WITH HASHED PASSWORDS
    const logPayload = {
      ...validatedData,
      password: hashedPassword,
      confirm_password: hashedConfirmPassword
    };
    console.log('👤 === CREATE USER ===');
    console.log('📦 Request payload:', JSON.stringify(logPayload, null, 2));

// PREPARE COMPLETE PAYLOAD WITH HASHED PASSWORDS
    const payload = {
      transaction_id: transactionId,
      user_data: {
        ...validatedData,
        password: hashedPassword,
        confirm_password: hashedConfirmPassword
      },
      user_id: req.user?.id || null,
      timestamp: new Date().toISOString()
    };

// PUBLISH TO USER QUEUE
    await rabbitmq.publishToQueue(QUEUES.USERS, payload);
    console.log(`📤 User registration published to queue: ${QUEUES.USERS}`);
    
    res.status(202).json({
      success: true,
      message: '✅ User creation request received and is being processed',
      transaction_id: transactionId,
      status: STATUS.ACTIVE
    });

  } catch (error) {
    const ErrorHandler = require('../utils/errorHandler');
    ErrorHandler.handleError(error, res, 'Create user');
  }
};

// LOGIN USER
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 === USER LOGIN REQUEST ===');
    console.log('📦 Login payload:', JSON.stringify({ username, password: '[HIDDEN]' }, null, 2));
    console.log(`👤 Login attempt for user: ${username}`);
    
// VALIDATE REQUIRED FIELDS
    if (!username || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }
    
// GET USER FROM BACKEND-USER SERVICE
    const userResponse = await users.getUserByUsername(username);
    
    if (!userResponse.success) {
      console.log(`❌ User lookup failed: ${username}`);
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    const user = userResponse.user;
    console.log(`✅ User found - ID: ${user.id}, Email: ${user.email_address}`);
    
// VERIFY PASSWORD
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log(`❌ Password verification failed for user: ${username}`);
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    console.log(`✅ Password verified successfully for user: ${username}`);
    
// GENERATE JWT TOKEN
    const tokenPayload = {
      user_id: user.id,
      username: user.username,
      email: user.email_address,
      role: user.role
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
    
    const responsePayload = {
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email_address: user.email_address,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
    
    console.log('📤 Login response payload:', JSON.stringify({
      ...responsePayload,
      token: '[GENERATED_TOKEN]'
    }, null, 2));
    console.log(`✅ Login completed successfully for user: ${username}`);
    
    res.json(responsePayload);
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      error: 'Login service unavailable' 
    });
  }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    console.log('👥 === GET ALL USERS ===');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token being passed to users service:', token ? 'Found' : 'Not found');
    
    const response = await users.getAllUsers(token);
    
    console.log(`✅ Retrieved ${response.users.length} users`);
    res.json(response);
  } catch (error) {
    console.error('❌ Get all users error:', error.message);
    res.status(500).json({ error: 'Users service unavailable' });
  }
};

// UPDATE USER ROLE
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log(`🔄 === UPDATE USER ROLE ===`);
    console.log(`👤 User ID: ${userId}, New Role: ${role}`);
    
    const response = await users.updateUserRole(userId, role);
    
    console.log(`✅ User role updated successfully`);
    res.json(response);
  } catch (error) {
    console.error('❌ Update user role error:', error.message);
    res.status(500).json({ error: 'User role update failed' });
  }
};

module.exports = {
  validateUser,
  createUser,
  login,
  getAllUsers,
  updateUserRole
};