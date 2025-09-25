const amqp = require('amqplib');
const { pool } = require('../config/db');
const { HTTP_STATUS, MESSAGES, DB_ERRORS } = require('../config/errorcodes');

const QUEUE_NAME = 'queue_land_registry';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// RabbitMQ connection
let connection = null;
let channel = null;

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Declare queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    console.log(`Connected to RabbitMQ - Queue: ${QUEUE_NAME}`);
    return true;
  } catch (error) {
    console.error('RabbitMQ connection failed:', error.message);
    return false;
  }
};

// Start RabbitMQ consumer
const startConsumer = async () => {
  console.log('Starting Land Title Message Consumer...');
  
  const connected = await connectRabbitMQ();
  if (!connected) {
    console.log('Retrying RabbitMQ connection in 10 seconds...');
    setTimeout(startConsumer, 10000);
    return;
  }

  // Consume messages from queue
  channel.consume(QUEUE_NAME, async (message) => {
    if (message) {
      try {
        const messageData = JSON.parse(message.content.toString());
        console.log('Received land title message:', messageData);
        
        // Process the message
        await processLandTitleCreation(messageData);
        
        // Acknowledge message
        channel.ack(message);
        console.log('Message processed and acknowledged');
        
      } catch (error) {
        console.error('Message processing failed:', error.message);
        // Reject message (will be requeued)
        channel.nack(message, false, true);
      }
    }
  });

  console.log(`Waiting for messages from ${QUEUE_NAME}...`);
};

// PROCESS LAND TITLE CREATION MESSAGE
const processLandTitleCreation = async (messageData) => {
  try {

// ENSURE TABLE EXISTS FIRST
    await pool.query(`
      CREATE TABLE IF NOT EXISTS land_titles (
        id SERIAL PRIMARY KEY,
        owner_name VARCHAR(255),
        contact_no VARCHAR(20),
        title_number VARCHAR(20) UNIQUE NOT NULL,
        address TEXT,
        property_location VARCHAR(100),
        lot_number INT,
        survey_number VARCHAR(20),
        area_size NUMERIC,
        classification VARCHAR(50),
        registration_date DATE,
        registrar_office VARCHAR(100),
        previous_title_number VARCHAR(100),
        encumbrances TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const { 
      owner_name, contact_no, title_number, address, property_location, 
      lot_number, survey_number, area_size, classification,
      registration_date, registrar_office, previous_title_number, encumbrances 
    } = messageData;

// VALIDATE DATA
    if (!owner_name || !title_number || !address) {
      throw new Error('Missing required fields: owner_name, title_number, address');
    }

// SAVE TO DATABASE
    const result = await pool.query(`
      INSERT INTO land_titles (
        owner_name, contact_no, title_number, address, property_location,
        lot_number, survey_number, area_size, classification, registration_date,
        registrar_office, previous_title_number, encumbrances, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING')
      RETURNING *
    `, [
      owner_name, contact_no, title_number, address, property_location,
      lot_number, survey_number, area_size, classification, registration_date,
      registrar_office, previous_title_number, encumbrances
    ]);

    console.log('Land title processed successfully:', result.rows[0]);
    return result.rows[0];

  } catch (error) {
    console.error('Land title processing failed:', error.message);
    throw error;
  }
};

module.exports = {
  startConsumer,
  processLandTitleCreation
};