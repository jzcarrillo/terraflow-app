const httpClient = require('../utils/httpClient');
const config = require('../config/services');

class LandTitleService {
  
  // GET ALL LAND TITLES
  async getLandTitles(token = null) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await httpClient.get(`${config.services.landregistry}/api/land-titles`, { headers });
    return response;
  }

  // GET LAND TITLE BY ID
  async getLandTitle(id, token = null) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await httpClient.get(`${config.services.landregistry}/api/land-titles/${id}`, { headers });
    return response;
  }

  // VALIDATE TITLE NUMBER
  async validateTitleNumber(titleNumber, token = null) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await httpClient.get(`${config.services.landregistry}/api/land-titles/validate/${titleNumber}`, { headers });
    return response.data;
  }

  // VALIDATE LAND TITLE EXISTS
  async validateLandTitleExists(landTitleId) {
    try {
      const response = await httpClient.get(`${config.services.landregistry}/api/land-titles/validate/land-title-exists?land_title_id=${landTitleId}`);
      return response.data;
    } catch (error) {
      return { exists: false, message: 'Land title validation service unavailable' };
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;