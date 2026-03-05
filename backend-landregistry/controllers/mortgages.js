const mortgageService = require('../services/mortgage');
const { handleError } = require('../utils/errorHandler');

const createMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const mortgageData = req.body;
    const userId = req.user?.id || null;
    
    console.log(`🏦 Creating mortgage for land title: ${id}`);
    
    const messageData = {
      transaction_id: require('crypto').randomUUID(),
      mortgage_data: {
        ...mortgageData,
        land_title_id: parseInt(id)
      },
      attachments: req.files || [],
      user_id: userId
    };
    
    const mortgage = await mortgageService.createMortgage(messageData);
    
    res.status(201).json({
      success: true,
      message: 'Mortgage created successfully',
      data: mortgage
    });
  } catch (error) {
    handleError(error, res, 'Create mortgage');
  }
};

const getAllMortgages = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    
    const query = `
      SELECT m.*, lt.title_number 
      FROM mortgages m
      LEFT JOIN land_titles lt ON m.land_title_id = lt.id
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    handleError(error, res, 'Get all mortgages');
  }
};

const getMortgagesByLandTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/db');
    
    const query = 'SELECT * FROM mortgages WHERE land_title_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    handleError(error, res, 'Get mortgages by land title');
  }
};

const getMortgageById = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/db');
    
    const query = 'SELECT * FROM mortgages WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mortgage not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    handleError(error, res, 'Get mortgage by ID');
  }
};

const updateMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating mortgage: ${id}`);
    
    const mortgage = await mortgageService.updateMortgage(parseInt(id), updateData);
    
    res.json({
      success: true,
      message: 'Mortgage updated successfully',
      data: mortgage
    });
  } catch (error) {
    handleError(error, res, 'Update mortgage');
  }
};

const cancelMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`❌ Cancelling mortgage: ${id}`);
    
    const mortgage = await mortgageService.cancelMortgage(parseInt(id));
    
    res.json({
      success: true,
      message: 'Mortgage cancelled successfully',
      data: mortgage
    });
  } catch (error) {
    handleError(error, res, 'Cancel mortgage');
  }
};

const releaseMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    
    console.log(`🔓 Releasing mortgage: ${id}`);
    console.log(`👤 User ID: ${userId}`);
    
    const mortgage = await mortgageService.createReleaseMortgage({
      mortgage_id: parseInt(id),
      user_id: userId
    });
    
    console.log(`✅ Release mortgage successful:`, mortgage);
    
    res.json({
      success: true,
      message: 'Mortgage release initiated',
      data: mortgage
    });
  } catch (error) {
    console.error(`❌ Release mortgage error:`, error);
    console.error(`❌ Error stack:`, error.stack);
    handleError(error, res, 'Release mortgage');
  }
};

const getLandTitlesForMortgage = async (req, res) => {
  try {
    const landTitles = await mortgageService.getLandTitlesForMortgage();
    
    res.json({
      success: true,
      count: landTitles.length,
      data: landTitles
    });
  } catch (error) {
    handleError(error, res, 'Get land titles for mortgage');
  }
};

const getMortgagesForPayment = async (req, res) => {
  try {
    const { reference_type } = req.query;
    
    const mortgages = await mortgageService.getMortgagesForPayment(reference_type);
    
    res.json({
      success: true,
      count: mortgages.length,
      data: mortgages
    });
  } catch (error) {
    handleError(error, res, 'Get mortgages for payment');
  }
};

const checkTransferEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    
    const eligible = await mortgageService.checkTransferEligibility(parseInt(id));
    
    res.json({
      success: true,
      eligible: eligible,
      message: eligible ? 'Land title can be transferred' : 'Land title has active mortgages'
    });
  } catch (error) {
    handleError(error, res, 'Check transfer eligibility');
  }
};

const getMortgageCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/db');
    const result = await pool.query(
      "SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ('ACTIVE', 'PENDING')",
      [parseInt(id)]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    handleError(error, res, 'Get mortgage count');
  }
};

const checkPendingTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/db');
    const result = await pool.query(
      'SELECT transfer_id FROM land_transfers WHERE land_title_id = $1 AND status = $2',
      [parseInt(id), 'PENDING']
    );
    res.json({ hasPendingTransfer: result.rows.length > 0, transfer_id: result.rows[0]?.transfer_id || null });
  } catch (error) {
    handleError(error, res, 'Check pending transfer');
  }
};

module.exports = {
  createMortgage,
  getAllMortgages,
  getMortgagesByLandTitle,
  getMortgageById,
  updateMortgage,
  cancelMortgage,
  releaseMortgage,
  getLandTitlesForMortgage,
  getMortgagesForPayment,
  checkTransferEligibility,
  getMortgageCount,
  checkPendingTransfer
};
