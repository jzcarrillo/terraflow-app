const mortgageService = require('../services/mortgages');
const ErrorHandler = require('../utils/errorHandler');

const getAllMortgages = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await mortgageService.getAllMortgages(token);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get all mortgages');
  }
};

const getMortgageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mortgageService.getMortgageById(id);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get mortgage by ID');
  }
};

const createMortgage = async (req, res) => {  
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    const mortgageData = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('📦 Mortgage request received');
    console.log('Params ID:', id);
    console.log('Body:', mortgageData);
    console.log('Files:', req.files);
    
    // Convert string values to proper types (FormData sends everything as strings)
    const processedData = {
      ...mortgageData,
      land_title_id: parseInt(id),
      amount: parseFloat(mortgageData.amount)
    };
    
    // Validate with schema
    const { mortgageSchema } = require('../schemas/mortgages');
    const validatedData = mortgageSchema.parse(processedData);
    
    // Pre-validate: check mortgage count before publishing to queue
    const config = require('../config/services');
    const httpClient = require('../utils/httpClient');
    const [countResult, transferResult] = await Promise.all([
      httpClient.get(`${config.services.landregistry}/api/mortgages/count/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      httpClient.get(`${config.services.landregistry}/api/mortgages/check-pending-transfer/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (countResult.data.count >= 3) {
      return res.status(400).json({ error: 'Maximum 3 mortgages allowed per land title' });
    }
    if (transferResult.data.hasPendingTransfer) {
      return res.status(400).json({ error: `Cannot create mortgage. Land title has a pending transfer (${transferResult.data.transfer_id}).` });
    }
    
    console.log('✅ Validated data:', validatedData);
    console.log('📎 Files to process:', req.files?.length || 0);
    
    // Prepare payload with attachments
    const rabbitmq = require('../services/publisher');
    const payload = {
      transaction_id: transactionId,
      mortgage_data: validatedData,
      attachments: req.files ? req.files.map(file => ({
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        buffer: file.buffer.toString('base64'),
        document_type: file.fieldname
      })) : [],
      user_id: req.user?.user_id || req.user?.id
    };
    
    console.log('📤 Publishing to queue with', payload.attachments.length, 'attachments');
    
    // Publish to land registry queue
    await rabbitmq.publishToQueue('queue_landregistry', payload);
    
    res.status(202).json({
      success: true,
      message: 'Mortgage submission received and is being processed',
      transaction_id: transactionId
    });
  } catch (error) {
    console.error('❌ Create mortgage error:', error);
    ErrorHandler.handleError(error, res, 'Create mortgage');
  }
};

const updateMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const result = await mortgageService.updateMortgage(id, updateData, token);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Update mortgage');
  }
};

const cancelMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const result = await mortgageService.cancelMortgage(id, token);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Cancel mortgage');
  }
};

const releaseMortgage = async (req, res) => {
  const transactionId = require('crypto').randomUUID();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const rabbitmq = require('../services/publisher');
    const payload = {
      transaction_id: transactionId,
      release_mortgage_data: {
        mortgage_id: parseInt(id),
        user_id: userId
      }
    };
    
    await rabbitmq.publishToQueue('queue_landregistry', payload);
    
    res.status(202).json({
      success: true,
      message: 'Mortgage release request is being processed',
      transaction_id: transactionId
    });
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Release mortgage');
  }
};

const getLandTitlesForMortgage = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await mortgageService.getLandTitlesForMortgage(token);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get land titles for mortgage');
  }
};

const getMortgagesForPayment = async (req, res) => {
  try {
    const { reference_type } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await mortgageService.getMortgagesForPayment(reference_type, token);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get mortgages for payment');
  }
};

const checkTransferEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mortgageService.checkTransferEligibility(id);
    res.json(result);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Check transfer eligibility');
  }
};

const viewAttachment = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const config = require('../config/services');
    const httpClient = require('../utils/httpClient');
    
    const response = await httpClient.get(
      `${config.services.documents}/api/documents/view/${documentId}`,
      { responseType: 'stream' }
    );
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    res.setHeader('Content-Length', response.headers['content-length']);
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('View attachment error:', error);
    ErrorHandler.handleError(error, res, 'View attachment');
  }
};

const downloadAttachment = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const config = require('../config/services');
    const httpClient = require('../utils/httpClient');
    
    const response = await httpClient.get(
      `${config.services.documents}/api/documents/download/${documentId}`,
      { 
        responseType: 'stream',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);
    res.setHeader('Content-Length', response.headers['content-length']);
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download attachment error:', error);
    ErrorHandler.handleError(error, res, 'Download attachment');
  }
};

const getMortgageAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const config = require('../config/services');
    const httpClient = require('../utils/httpClient');
    
    const response = await httpClient.get(
      `${config.services.documents}/api/documents/mortgage/${id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    res.json(response.data);
  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get mortgage attachments');
  }
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
  checkTransferEligibility,
  getMortgageAttachments,
  viewAttachment,
  downloadAttachment
};
