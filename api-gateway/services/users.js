const axios = require('axios');
const config = require('../config/services');

class UserService {
  
  // VALIDATE USERNAME AND EMAIL
  async validateUser(username, emailAddress) {
    try {
      console.log(`🔍 Validating user: ${username}, ${emailAddress}`);
      
      const response = await axios.get(`${config.services.users}/api/validate?username=${username}&email_address=${emailAddress}`);
      
      console.log(`✅ User validation result: ${response.data.valid}`);
      return response.data;
    } catch (error) {
      console.error('❌ User validation failed:', error.message);
      throw new Error('User validation service unavailable');
    }
  }
}

const userService = new UserService();
module.exports = userService;