const axios = require('axios');
const config = require('../config/services');

const transfersAPI = axios.create({
  baseURL: config.services.landregistry,
  timeout: 30000
});

const getAllTransfers = async (req, res) => {
  try {
    const response = await transfersAPI.get('/api/transfers', {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    console.error('❌ Get all transfers failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch transfers'
    });
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
    console.error('❌ Get transfer by ID failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch transfer'
    });
  }
};

const createTransfer = async (req, res) => {
  try {
    const response = await transfersAPI.post('/api/transfers', req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.status(201).json(response.data);
  } catch (error) {
    console.error('❌ Create transfer failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create transfer'
    });
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
    console.error('❌ Complete transfer failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to complete transfer'
    });
  }
};

const updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await transfersAPI.put(`/api/transfers/${id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    console.error('❌ Update transfer status failed:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update transfer status'
    });
  }
};

module.exports = {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransferStatus,
  completeTransfer
};