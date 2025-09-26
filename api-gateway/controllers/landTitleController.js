const config = require('../config/services');
const { landTitleSchema } = require('../schemas/landTitleSchema');
const rabbitmqService = require('../services/rabbitmqService');
const backendService = require('../services/backendService');
const redisService = require('../services/redisService');

const QUEUE_NAME = 'queue_landregistry';

// CREATE LAND TITLE
const createLandTitle = async (req, res) => {
  try {
    // LOG REQUEST PAYLOAD
    console.log('📋 === CREATE LAND TITLE REQUEST ===');
    console.log('📦 Request payload:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log(`➡️ Title ${validatedData.title_number} is valid, sending to queue`);

    // Clear cache since new data will be added
    try {
      await redisService.clearLandTitlesCache();
      console.log('🗑️ [API] Cache cleared after new land title submission');
    } catch (error) {
      console.log('⚠️ [API] Cache clear failed (non-critical):', error.message);
    }

    // PUBLISH TO QUEUE
    await rabbitmqService.publishToQueue(QUEUE_NAME, validatedData);

    res.status(202).json({
      message: 'Land title request submitted for processing',
      title_number: validatedData.title_number,
      status: 'QUEUED'
    });

  } catch (error) {
    console.error('Create land title error:', error.message);
    
// HANDLE ZOD VALIDATION ERRORS
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      });
    }
    
    if (error.message.includes('RabbitMQ')) {
      res.status(500).json({ error: 'Message queue unavailable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// GET ALL LAND TITLES
const getAllLandTitles = async (req, res) => {
  try {
    console.log('🔍 Getting all land titles');
    
// CHECK REDIS CACHE FIRST Check Redis cache first
    const cached = await redisService.getLandTitles();
    if (cached) {
      console.log('⚡ Returning cached land titles from Redis');
      return res.json({
        message: 'Land titles retrieved from cache',
        data: cached,
        source: 'redis',
        user: req.user.id
      });
    }

// CACHE MISS - CALL BACKEND
    console.log('📡 Cache miss, calling backend');
    const response = await backendService.getLandTitles();
    
    // CACHE THE RESULT
    await redisService.cacheLandTitles(response.data, 30); // 30 seconds TTL
    
    console.log('✅ Land titles retrieved and cached');
    res.json({
      message: 'Land titles retrieved from database',
      data: response.data,
      source: 'database',
      user: req.user.id
    });

  } catch (error) {
    console.error('❌ Get all land titles error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve land titles' });
  }
};

// GET SINGLE LAND TITLE
const getLandTitle = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Getting land title ID: ${id}`);
    
// CHECK REDIS CACHE FIRST
    const cached = await redisService.getLandTitle(id);
    if (cached) {
      console.log(`⚡Returning cached land title ${id} from Redis`);
      return res.json({
        message: 'Land title retrieved from cache',
        data: cached,
        source: 'redis',
        user: req.user.id
      });
    }

// CACHE MISS - CALL BACKEND 
    console.log(`📡 Cache miss, calling backend for ID: ${id}`);
    const response = await backendService.getLandTitle(id);
    
    // CACHE THE RESULT
    await redisService.cacheLandTitle(id, response.data, 30); // 30 seconds TTL
    
    console.log(`✅ Land title ${id} retrieved and cached`);
    res.json({
      message: 'Land title retrieved from database',
      data: response.data,
      source: 'database',
      user: req.user.id
    });

  } catch (error) {
    console.error(`❌ Get land title ${req.params.id} error:`, error.message);
    res.status(500).json({ error: 'Failed to retrieve land title' });
  }
};

module.exports = {
  createLandTitle,
  getAllLandTitles,
  getLandTitle
};