const axios = require('axios');
const config = require('../config/services');

class UserService {
  
  // VALIDATE USERNAME AND EMAIL
  async validateUser(username, emailAddress) {
    try {
      const response = await axios.get(`${config.services.users}/api/validate?username=${username}&email_address=${emailAddress}`);
      return response.data;
    } catch (error) {
      console.error('❌ User validation failed:', error.message);
      throw new Error('User validation service unavailable');
    }
  }

  // GET USER BY USERNAME FOR LOGIN
  async getUserByUsername(username) {
    try {
      const response = await axios.get(`${config.services.users}/api/user/${username}`);
      return { success: true, user: response.data };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { success: false, message: 'User not found' };
      }
      console.error('❌ Get user failed:', error.message);
      throw new Error('User service unavailable');
    }
  }

  // GET ALL USERS
  async getAllUsers(token = null) {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${config.services.users}/api/users`, { headers });
      return { success: true, users: response.data.users || response.data };
    } catch (error) {
      console.error('❌ Get all users failed:', error.message);
      throw new Error('Users service unavailable');
    }
  }

  // UPDATE USER ROLE
  async updateUserRole(userId, role) {
    try {
      const response = await axios.put(`${config.services.users}/api/users/${userId}/role`, { role });
      return { success: true, user: response.data };
    } catch (error) {
      console.error('❌ Update user role failed:', error.message);
      throw new Error('User role update service unavailable');
    }
  }
}

const userService = new UserService();
module.exports = userService;