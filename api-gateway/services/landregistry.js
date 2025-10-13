const axios = require('axios');

const BACKEND_LANDREGISTRY_URL = `http://backend-landregistry-service:3000`;

class LandRegistryService {
  
  async validateLandTitleExists(landTitleId) {
    try {
      console.log(`🔍 Validating land title exists: ${landTitleId}`);
      const response = await axios.get(`${BACKEND_LANDREGISTRY_URL}/api/land-titles/validate/land-title-exists?land_title_id=${landTitleId}`);
      console.log(`✅ Land title validation result: ${response.data.exists}`);
      return response.data;
    } catch (error) {
      console.error('❌ Land title validation service error:', error.message);
      return { exists: false, message: 'Land title validation service unavailable' };
    }
  }
}

const landRegistryService = new LandRegistryService();
module.exports = landRegistryService;