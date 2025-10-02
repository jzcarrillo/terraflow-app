const userService = require('../services/userService');

const processUserCreation = async (messageData) => {
  const { transaction_id, user_data } = messageData;
  
  try {
    
// VALIDATE REQUIRED FIELDS
    userService.validateRequiredFields(user_data);
    
// CHECK IF EMAIL EXISTS
    const exists = await userService.checkEmailExists(user_data.email_address);
    if (exists) {
      throw new Error(`Email address ${user_data.email_address} already exists in database`);
    }

// CREATE USER WITH PENDING STATUS
    const result = await userService.createUser({
      ...user_data,
      transaction_id: transaction_id,
      status: 'PENDING'
    });
    
    return result;

  } catch (error) {
    console.error(`❌ User processing failed: ${transaction_id}`, error.message);
    throw error;
  }
};

module.exports = {
  processUserCreation
};