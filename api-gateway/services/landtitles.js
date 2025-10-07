const axios = require('axios');
const config = require('../config/services');

class LandTitleService {
  
  // VALIDATE LAND TITLE
  async validateTitleNumber(titleNumber) {
    try {
      console.log(`🔍 Validating title: ${titleNumber}`);
      
      const response = await axios.get(`${config.services.landRegistry}/api/land-titles/validate/${titleNumber}`);
      
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
      const response = await axios.get(`${config.services.landRegistry}/api/land-titles`);
      return response;
    } catch (error) {
      console.error('❌ Get land titles failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }

  // GET LAND TITLE BY ID
  async getLandTitle(id) {
    try {
      const response = await axios.get(`${config.services.landRegistry}/api/land-titles/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Get land title failed:', error.message);
      throw new Error('Land registry service unavailable');
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;