const transferService = require('../services/transfers');

// Helper function for success response
const sendSuccess = (res, data, message, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Helper function for error response
const sendError = (res, error, action) => {
  console.error(`❌ ${action} error:`, error.message);
  res.status(500).json({
    success: false,
    error: error.message || `Failed to ${action.toLowerCase()}`
  });
};

const submitTransfer = async (req, res) => {
  try {
    const transferData = {
      ...req.body,
      created_by: req.user?.id || 1
    };
    
    console.log('🔄 Submitting transfer:', transferData);
    const transfer = await transferService.submitTransfer(transferData);
    sendSuccess(res, transfer, 'Transfer request submitted successfully', 201);
  } catch (error) {
    sendError(res, error, 'Submit transfer');
  }
};

const getAllTransfers = async (req, res) => {
  try {
    const transfers = await transferService.getAllTransfers();
    res.json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    sendError(res, error, 'Get all transfers');
  }
};

const updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating transfer status: ID=${id}, Status=${status}`);
    const transfer = await transferService.updateTransferStatus(id, status);
    sendSuccess(res, transfer, 'Transfer status updated successfully');
  } catch (error) {
    sendError(res, error, 'Update transfer status');
  }
};

const updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Updating transfer: ID=${id}`);
    const transfer = await transferService.updateTransfer(id, req.body);
    sendSuccess(res, transfer, 'Transfer updated successfully');
  } catch (error) {
    sendError(res, error, 'Update transfer');
  }
};

const deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await transferService.deleteTransfer(id);
    sendSuccess(res, transfer, 'Transfer deleted successfully');
  } catch (error) {
    sendError(res, error, 'Delete transfer');
  }
};

module.exports = {
  submitTransfer,
  getAllTransfers,
  updateTransferStatus,
  updateTransfer,
  deleteTransfer
};