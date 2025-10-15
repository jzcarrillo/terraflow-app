const axios = require('axios');
const config = require('../config/services');

// Create axios instance with timeout and auth
const httpClient = axios.create({
  timeout: 5000, // 5 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6IkNBU0hJRVIgMSIsImVtYWlsIjoiY2FzaGllcjFAZXhhbXBsZS5jb20iLCJleHAiOjIwNzU4NjY2NTMsImlhdCI6MTc2MDUwNjY1M30.5SxQjX8s4z3s8hibgxxARXfB6OUWsgidUu8AQRz-nNA'
  }
});

class LandTitleService {
  
  // VALIDATE LAND TITLE
  async validateTitleNumber(titleNumber) {
    try {
      console.log(`🔍 Validating title: ${titleNumber}`);
      
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles/validate/${titleNumber}`);
      
      console.log(`✅ Title validation result: ${response.data.exists}`);
      return response.data;
    } catch (error) {
      console.error('❌ Title validation failed:', error.message);
      throw new Error('Land registry validation service unavailable');
    }
  }

  // GET ALL LAND TITLES
  async getLandTitles() {
    try {
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles`);
      return response;
    } catch (error) {
      console.error('❌ Get land titles failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }

  // GET LAND TITLE BY ID
  async getLandTitle(id) {
    try {
      const response = await httpClient.get(`${config.services.landRegistry}/api/land-titles/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Get land title failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;