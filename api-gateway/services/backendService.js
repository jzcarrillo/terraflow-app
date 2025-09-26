const axios = require('axios');
const config = require('../config/services');

class BackendService {
  constructor() {
    this.backendUrl = config.backend?.url || 'http://backend-landregistry-service:3000';
  }

  async validateTitleNumber(titleNumber) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/validate/${titleNumber}`);
      return response.data.exists;
    } catch (error) {
      console.error('Backend validation failed:', error.message);
      throw new Error('Validation service unavailable');
    }
  }
}

const backendService = new BackendService();
module.exports = backendService;