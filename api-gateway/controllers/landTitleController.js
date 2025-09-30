const config = require('../config/services');
const { landTitleSchema } = require('../schemas/landTitleSchema');
const rabbitmqService = require('../services/rabbitmqService');
const backendService = require('../services/backendService');
const redisService = require('../services/redisService');
const { QUEUES, STATUS, CACHE } = require('../config/constants');

// CREATE LAND TITLE WITH DOCUMENTS
const createLandTitle = async (req, res) => {

// CORRELATION ID 
  const transactionId = require('crypto').randomUUID();
  
  try {
// LOG REQUEST PAYLOAD
    console.log('📋 === CREATE LAND TITLE WITH DOCUMENTS ===');
    console.log('📦 Request payload:', JSON.stringify(req.body, null, 2));
    console.log('📎 Files:', req.files ? req.files.length : 0);
    
// VALIDATE REQUEST USING ZOD
    const validatedData = landTitleSchema.parse(req.body);
    console.log('✅ Validation successful for title:', validatedData.title_number);

// VALIDATE TITLE NUMBER VIA BACKEND
    console.log(`🔎 Checking duplicate for title: ${validatedData.title_number}`);
    const isDuplicate = await backendService.validateTitleNumber(validatedData.title_number);
    console.log(`🔵 Duplicate check result: ${isDuplicate}`);
    
    if (isDuplicate) {
      console.log(`❌ Rejecting duplicate title: ${validatedData.title_number}`);
      return res.status(409).json({
        error: 'Duplicate title number',
        message: `Title number ${validatedData.title_number} already exists`
      });
    }
    
    console.log(`➡️ Title ${validatedData.title_number} is valid, preparing event payload`);

// PREPARE COMPLETE PAYLOAD WITH ATTACHMENTS
    const payload = {
      transaction_id: transactionId,
      land_title_data: validatedData,
      attachments: req.files ? req.files.map(file => ({
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        buffer: file.buffer.toString('base64'),
        document_type: file.fieldname
      })) : [],
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

// CLEAR CACHE SINCE NEW DATA WILL BE ADDED 
    try {
      await redisService.clearLandTitlesCache();
      console.log('🗑️ Cache cleared after new land title submission');
    } catch (error) {
      console.log('⚠️  Cache clear failed (non-critical):', error.message);
    }

// PUBLISH TO LAND REGISTRY QUEUE
    await rabbitmqService.publishToQueue(QUEUES.LAND_REGISTRY, payload);

    res.status(202).json({
      success: true,
      message: '✅ Land title submission received and is being processed',
      transaction_id: transactionId,
      title_number: validatedData.title_number,
      status: STATUS.PROCESSING
    });

  } catch (error) {
    const ErrorHandler = require('../utils/errorHandler');
    ErrorHandler.handleError(error, res, 'Create land title');
  }
};

// GET ALL LAND TITLES
const getAllLandTitles = async (req, res) => {
  const CacheHelper = require('../utils/cacheHelper');
  const ErrorHandler = require('../utils/errorHandler');
  
  try {
    console.log('🔍 Getting all land titles');
    
    const result = await CacheHelper.getCachedOrFetch(
      'land_titles:all',
      () => backendService.getLandTitles().then(response => response.data)
    );
    
    const message = result.source === 'redis' 
      ? 'Land titles retrieved from cache'
      : 'Land titles retrieved from database';
    
    console.log(`✅ Land titles retrieved from ${result.source}`);
    res.json(CacheHelper.formatResponse(message, result.data, result.source, req.user.id));

  } catch (error) {
    ErrorHandler.handleError(error, res, 'Get all land titles');
  }
};

// GET SINGLE LAND TITLE
const getLandTitle = async (req, res) => {
  const CacheHelper = require('../utils/cacheHelper');
  const ErrorHandler = require('../utils/errorHandler');
  
  try {
    const { id } = req.params;
    console.log(`🔍 Getting land title ID: ${id}`);
    
    const result = await CacheHelper.getCachedOrFetch(
      `land_title:${id}`,
      () => backendService.getLandTitle(id).then(response => response.data)
    );
    
    const message = result.source === 'redis'
      ? 'Land title retrieved from cache'
      : 'Land title retrieved from database';
    
    console.log(`✅ Land title ${id} retrieved from ${result.source}`);
    res.json(CacheHelper.formatResponse(message, result.data, result.source, req.user.id));

  } catch (error) {
    ErrorHandler.handleError(error, res, `Get land title ${req.params.id}`);
  }
};

module.exports = {
  createLandTitle,
  getAllLandTitles,
  getLandTitle
};