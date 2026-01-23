const transferService = require('../services/transfers');

const submitTransfer = async (req, res) => {
  try {
    const transferData = {
      ...req.body,
      created_by: req.user?.id || 1
    };
    
    console.log('🔄 Submitting transfer:', transferData);
    
    const transfer = await transferService.submitTransfer(transferData);
    
    res.status(201).json({
      success: true,
      message: 'Transfer request submitted successfully',
      data: transfer
    });
  } catch (error) {
    console.error('❌ Submit transfer error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit transfer'
    });
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
    console.error('❌ Get all transfers error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transfers'
    });
  }
};

const updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating transfer status: ID=${id}, Status=${status}`);
    
    const transfer = await transferService.updateTransferStatus(id, status);
    
    res.json({
      success: true,
      message: 'Transfer status updated successfully',
      data: transfer
    });
  } catch (error) {
    console.error('❌ Update transfer status error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update transfer status'
    });
  }
};

const deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transfer = await transferService.deleteTransfer(id);
    
    res.json({
      success: true,
      message: 'Transfer deleted successfully',
      data: transfer
    });
  } catch (error) {
    console.error('❌ Delete transfer error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete transfer'
    });
  }
};

module.exports = {
  submitTransfer,
  getAllTransfers,
  updateTransferStatus,
  deleteTransfer
};