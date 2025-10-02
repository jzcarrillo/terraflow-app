const axios = require('axios');
const config = require('../config/services');

class LandTitleService {
  
  // VALIDATE LAND TITLE
  async validateTitleNumber(titleNumber) {
    try {
      console.log(`🔍 Validating title: ${titleNumber}`);
      
      const response = await axios.get(`${config.services.landRegistry}/api/validate/${titleNumber}`);
      
      console.log(`✅ Title validation result: ${response.data.exists}`);
      return response.data;
    } catch (error) {
      console.error('❌ Title validation failed:', error.message);
      throw new Error('Land registry validation service unavailable');
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;