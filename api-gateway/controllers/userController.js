const config = require('../config/services');
const rabbitmq = require('../services/rabbitmq');
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
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

// PUBLISH TO USER QUEUE
    await rabbitmq.publishToQueue(QUEUES.USERS, payload);
    
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

module.exports = {
  validateUser,
  createUser
};