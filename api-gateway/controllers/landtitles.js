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
  
  console.log('📋 === CREATE LAND TITLE WITH DOCUMENTS ===');
  console.log('📦 Request payload:', JSON.stringify(req.body, null, 2));
  console.log('📎 Files:', req.files ? req.files.length : 0);
  
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
      user_id: req.user.user_id || req.user.id,
      timestamp: new Date().toISOString()
    };
    
    // Clear file buffers from memory
    if (req.files) {
      req.files.forEach(file => {
        file.buffer = null;
      });
    }

// CLEAR CACHE SINCE NEW DATA WILL BE ADDED 
    try {
      await redis.clearLandTitlesCache();

    } catch (error) {
      console.log('⚠️  Cache clear failed (non-critical):', error.message);
    }

// PUBLISH TO LAND REGISTRY QUEUE
    try {
      await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, payload);
      console.log(`📤 Land title published to queue: ${validatedData.title_number}`);
      
      res.status(202).json({
        success: true,
        message: '✅ Land title submission received and is being processed',
        transaction_id: transactionId,
        title_number: validatedData.title_number,
        status: STATUS.PENDING
      });
    } catch (publishError) {
      console.error('❌ Queue publish failed:', publishError.message);
      res.status(500).json({
        error: 'Failed to process land title submission',
        message: 'Message queue unavailable'
      });
    }

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
    
    // Ensure data is an array and add empty attachments array for frontend compatibility
    const dataArray = Array.isArray(result.data) ? result.data : (result.data?.data || []);
    const landTitlesWithAttachments = dataArray.map(title => ({
      ...title,
      attachments: [] // TODO: Fetch from documents service when available
    }));
    
    const message = result.source === 'redis' 
      ? 'Land titles retrieved from cache'
      : 'Land titles retrieved from database';
    
    console.log(`✅ Land titles retrieved from ${result.source}`);
    res.json(CacheHelper.formatResponse(message, landTitlesWithAttachments, result.source, req.user.id));

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