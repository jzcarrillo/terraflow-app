const config = require('../config/services');
const { landTitleSchema } = require('../schemas/landtitles');
const rabbitmq = require('../services/publisher');
const landtitles = require('../services/landtitles');
const redis = require('../services/redis');
const { QUEUES, STATUS, CACHE } = require('../config/constants');

// VALIDATE TITLE NUMBER - CHECK DUPLICATES
const validateTitleNumber = async (req, res) => {
  try {
    const { titleNumber } = req.params;
    console.log(`🔍 Validating title: ${titleNumber}`);
    
    const response = await landtitles.validateTitleNumber(titleNumber);
    
    console.log(`✅ Title validation result: ${response.exists}`);
    res.json(response);
  } catch (error) {
    console.error('❌ Title validation failed:', error.message);
    res.status(500).json({ exists: false, message: 'Title validation service unavailable' });
  }
};

// CREATE LAND TITLE WITH DOCUMENTS
const createLandTitle = async (req, res) => {

// CORRELATION ID 
  const transactionId = require('crypto').randomUUID();
  
  try {
// PREPROCESS MULTIPART FORM DATA (convert string numbers to numbers)
    const processedBody = { ...req.body };
    if (processedBody.lot_number && typeof processedBody.lot_number === 'string') {
      processedBody.lot_number = parseInt(processedBody.lot_number, 10);
    }
    if (processedBody.area_size && typeof processedBody.area_size === 'string') {
      processedBody.area_size = parseFloat(processedBody.area_size);
    }
    
// VALIDATE REQUEST USING ZOD FIRST
    const validatedData = landTitleSchema.parse(processedBody);
    console.log('✅ Zod validation successful for title:', validatedData.title_number);

// VALIDATE TITLE NUMBER VIA BACKEND
    const validateResponse = await landtitles.validateTitleNumber(validatedData.title_number);
    const isDuplicate = validateResponse.exists;
    
    if (isDuplicate) {
      console.log(`❌ Rejecting duplicate title: ${validatedData.title_number}`);
      return res.status(409).json({
        error: 'Duplicate title number',
        message: `Title number ${validatedData.title_number} already exists`
      });
    }
    
// LOG VALIDATED PAYLOAD (AFTER ALL VALIDATIONS PASS)
    console.log('📋 === CREATE LAND TITLE WITH DOCUMENTS ===');
    console.log('📦 Validated payload:', JSON.stringify(validatedData, null, 2));
    console.log('📎 Files:', req.files ? req.files.length : 0);
    
// LOG DOCUMENT DETAILS
    if (req.files && req.files.length > 0) {
      console.log('📄 Document details:');
      req.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
      });
    }
    


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
      await redis.clearLandTitlesCache();

    } catch (error) {
      console.log('⚠️  Cache clear failed (non-critical):', error.message);
    }

// PUBLISH TO LAND REGISTRY QUEUE
    await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, payload);

    res.status(202).json({
      success: true,
      message: '✅ Land title submission received and is being processed',
      transaction_id: transactionId,
      title_number: validatedData.title_number,
      status: STATUS.PENDING
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
      () => landtitles.getLandTitles().then(response => response.data)
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
      () => landtitles.getLandTitle(id).then(response => response.data)
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
  getLandTitle,
  validateTitleNumber
};