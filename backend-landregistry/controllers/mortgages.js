const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const mortgageService = require('../services/mortgage');
const { handleError } = require('../utils/errorHandler');

const createMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const messageData = {
      transaction_id: randomUUID(),
      mortgage_data: { ...req.body, land_title_id: parseInt(id) },
      attachments: req.files || [],
      user_id: userId
    };

    const mortgage = await mortgageService.createMortgage(messageData);
    res.status(201).json({ success: true, message: 'Mortgage created successfully', data: mortgage });
  } catch (error) {
    handleError(error, res, 'Create mortgage');
  }
};

const getAllMortgages = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, lt.title_number 
      FROM mortgages m
      LEFT JOIN land_titles lt ON m.land_title_id = lt.id
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    handleError(error, res, 'Get all mortgages');
  }
};

const getMortgagesByLandTitle = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mortgages WHERE land_title_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    handleError(error, res, 'Get mortgages by land title');
  }
};

const getMortgageById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mortgages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mortgage not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    handleError(error, res, 'Get mortgage by ID');
  }
};

const updateMortgage = async (req, res) => {
  try {
    const mortgage = await mortgageService.updateMortgage(parseInt(req.params.id), req.body);
    res.json({ success: true, message: 'Mortgage updated successfully', data: mortgage });
  } catch (error) {
    handleError(error, res, 'Update mortgage');
  }
};

const cancelMortgage = async (req, res) => {
  try {
    const mortgage = await mortgageService.cancelMortgage(parseInt(req.params.id));
    res.json({ success: true, message: 'Mortgage cancelled successfully', data: mortgage });
  } catch (error) {
    handleError(error, res, 'Cancel mortgage');
  }
};

const releaseMortgage = async (req, res) => {
  try {
    const mortgage = await mortgageService.createReleaseMortgage({
      mortgage_id: parseInt(req.params.id),
      user_id: req.user?.id || null
    });
    res.json({ success: true, message: 'Mortgage release initiated', data: mortgage });
  } catch (error) {
    handleError(error, res, 'Release mortgage');
  }
};

const getLandTitlesForMortgage = async (req, res) => {
  try {
    const landTitles = await mortgageService.getLandTitlesForMortgage();
    res.json({ success: true, count: landTitles.length, data: landTitles });
  } catch (error) {
    handleError(error, res, 'Get land titles for mortgage');
  }
};

const getMortgagesForPayment = async (req, res) => {
  try {
    const mortgages = await mortgageService.getMortgagesForPayment(req.query.reference_type);
    res.json({ success: true, count: mortgages.length, data: mortgages });
  } catch (error) {
    handleError(error, res, 'Get mortgages for payment');
  }
};

const checkTransferEligibility = async (req, res) => {
  try {
    const eligible = await mortgageService.checkTransferEligibility(parseInt(req.params.id));
    res.json({ success: true, eligible, message: eligible ? 'Land title can be transferred' : 'Land title has active mortgages' });
  } catch (error) {
    handleError(error, res, 'Check transfer eligibility');
  }
};

// Consolidated pre-validation for mortgage creation: count + pending transfer check
const validateMortgageCreation = async (req, res) => {
  try {
    const landTitleId = parseInt(req.params.id);
    const [countResult, transferResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ('ACTIVE', 'PENDING')", [landTitleId]),
      pool.query('SELECT transfer_id FROM land_transfers WHERE land_title_id = $1 AND status = $2', [landTitleId, 'PENDING'])
    ]);
    res.json({
      count: parseInt(countResult.rows[0].count),
      hasPendingTransfer: transferResult.rows.length > 0,
      transfer_id: transferResult.rows[0]?.transfer_id || null
    });
  } catch (error) {
    handleError(error, res, 'Validate mortgage creation');
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
  validateMortgageCreation
};
