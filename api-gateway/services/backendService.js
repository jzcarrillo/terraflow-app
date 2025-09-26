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

  async getLandTitles() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/land-titles`);
      return response.data;
    } catch (error) {
      console.error('Backend get land titles failed:', error.message);
      throw new Error('Backend service unavailable');
    }
  }

  async getLandTitle(id) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/land-titles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Backend get land title failed:', error.message);
      throw new Error('Backend service unavailable');
    }
  }
}

const backendService = new BackendService();
module.exports = backendService;