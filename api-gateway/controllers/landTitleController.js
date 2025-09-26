const config = require('../config/services');
const { landTitleSchema } = require('../schemas/landTitleSchema');
const rabbitmqService = require('../services/rabbitmqService');
const backendService = require('../services/backendService');

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

// Get all land titles (placeholder)
const getAllLandTitles = (req, res) => {
  res.json({ 
    message: 'Get all land titles', 
    data: [], 
    user: req.user.id 
  });
};

// Get single land title (placeholder)
const getLandTitle = (req, res) => {
  res.json({ 
    message: `Get land title ${req.params.id}`, 
    user: req.user.id 
  });
};

module.exports = {
  createLandTitle,
  getAllLandTitles,
  getLandTitle
};