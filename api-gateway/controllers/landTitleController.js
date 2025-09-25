const amqp = require('amqplib');
const config = require('../config/services');
const { landTitleSchema } = require('../schemas/landTitleSchema');

const QUEUE_NAME = config.rabbitmq.queues.landRegistry;
const RABBITMQ_URL = config.rabbitmq.url;

// RabbitMQ connection
let connection = null;
let channel = null;

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    if (!connection) {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log(`Connected to RabbitMQ - Queue: ${QUEUE_NAME}`);
    }
    return true;
  } catch (error) {
    console.error('RabbitMQ connection failed:', error.message);
    return false;
  }
};



// Create land title
const createLandTitle = async (req, res) => {
  try {
    // Validate request
    const { error, value } = landTitleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    // Connect to RabbitMQ
    const connected = await connectRabbitMQ();
    if (!connected) {
      return res.status(500).json({ error: 'Message queue unavailable' });
    }

    // Add metadata
    const messageData = {
      ...value,
      requestId: Date.now(),
      createdBy: req.user.id,
      timestamp: new Date().toISOString()
    };

    // Publish to queue
    const message = Buffer.from(JSON.stringify(messageData));
    channel.sendToQueue(QUEUE_NAME, message, { persistent: true });

    console.log('Land title request published to queue:', messageData);

    res.status(202).json({
      message: 'Land title request submitted for processing',
      requestId: messageData.requestId,
      status: 'QUEUED'
    });

  } catch (error) {
    console.error('Create land title error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
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