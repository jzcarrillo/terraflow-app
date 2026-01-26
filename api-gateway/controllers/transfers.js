const axios = require('axios');
const config = require('../config/services');

const transfersAPI = axios.create({
  baseURL: config.services.landregistry,
  timeout: 30000
});

// Helper function for error handling
const handleError = (error, res, action) => {
  console.error(`❌ ${action} failed:`, error.message);
  res.status(error.response?.status || 500).json({
    error: error.response?.data?.message || `Failed to ${action.toLowerCase()}`
  });
};

const getAllTransfers = async (req, res) => {
  try {
    const response = await transfersAPI.get('/api/transfers', {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    handleError(error, res, 'Get all transfers');
  }
};

const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await transfersAPI.get(`/api/transfers/${id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    handleError(error, res, 'Get transfer by ID');
  }
};

const createTransfer = async (req, res) => {
  try {
    const response = await transfersAPI.post('/api/transfers', req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.status(201).json(response.data);
  } catch (error) {
    handleError(error, res, 'Create transfer');
  }
};

const completeTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await transfersAPI.put(`/api/transfers/${id}/complete`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    handleError(error, res, 'Complete transfer');
  }
};

const updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await transfersAPI.put(`/api/transfers/${id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    handleError(error, res, 'Update transfer');
  }
};

const updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await transfersAPI.put(`/api/transfers/${id}/status`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    handleError(error, res, 'Update transfer status');
  }
};

module.exports = {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  updateTransferStatus,
  completeTransfer
};