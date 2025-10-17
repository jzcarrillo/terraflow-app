const axios = require('axios');
const config = require('../config/services');

// Create axios instance with timeout
const httpClient = axios.create({
  timeout: 5000, // 5 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

class LandTitleService {
  
  // VALIDATE LAND TITLE
  async validateTitleNumber(titleNumber, token = null) {
    try {
      console.log(`🔍 Validating title: ${titleNumber}`);
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles/validate/${titleNumber}`, { headers });
      
      console.log(`✅ Title validation result: ${response.data.exists}`);
      return response.data;
    } catch (error) {
      console.error('❌ Title validation failed:', error.message);
      throw new Error('Land registry validation service unavailable');
    }
  }

  // GET ALL LAND TITLES
  async getLandTitles(token = null) {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles`, { headers });
      return response;
    } catch (error) {
      console.error('❌ Get land titles failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }

  // GET LAND TITLE BY ID
  async getLandTitle(id, token = null) {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles/${id}`, { headers });
      return response;
    } catch (error) {
      console.error('❌ Get land title failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;