const httpClient = require('../utils/httpClient');
const config = require('../config/services');

const LANDREGISTRY_URL = config.services.landregistry;

const getAllMortgages = async (token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await httpClient.get(`${LANDREGISTRY_URL}/api/mortgages`, { headers });
  return response.data;
};

const getMortgageById = async (id) => {
  return await httpClient.get(`${LANDREGISTRY_URL}/api/mortgages/${id}`);
};

const createMortgage = async (landTitleId, mortgageData, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await httpClient.post(
    `${LANDREGISTRY_URL}/api/land-titles/${landTitleId}/mortgage`, 
    mortgageData,
    { headers }
  );
  return response.data;
};

const updateMortgage = async (id, updateData, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await httpClient.put(
    `${LANDREGISTRY_URL}/api/mortgages/${id}`, 
    updateData,
    { headers }
  );
  return response.data;
};

const cancelMortgage = async (id, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await httpClient.delete(
    `${LANDREGISTRY_URL}/api/mortgages/${id}`,
    { headers }
  );
  return response.data;
};

const releaseMortgage = async (id, userId, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await httpClient.post(`${LANDREGISTRY_URL}/api/mortgages/${id}/release`, { user_id: userId }, { headers });
  return response.data;
};

const getLandTitlesForMortgage = async (token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await httpClient.get(`${LANDREGISTRY_URL}/api/mortgages/available-titles`, { headers });
  return response.data;
};

const getMortgagesForPayment = async (referenceType, token) => {
  const params = referenceType ? `?reference_type=${referenceType}` : '';
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await httpClient.get(`${LANDREGISTRY_URL}/api/mortgages/for-payment${params}`, { headers });
  return response.data;
};

const checkTransferEligibility = async (landTitleId) => {
  return await httpClient.get(`${LANDREGISTRY_URL}/api/mortgages/check-transfer/${landTitleId}`);
};

module.exports = {
  getAllMortgages,
  getMortgageById,
  createMortgage,
  updateMortgage,
  cancelMortgage,
  releaseMortgage,
  getLandTitlesForMortgage,
  getMortgagesForPayment,
  checkTransferEligibility
};
