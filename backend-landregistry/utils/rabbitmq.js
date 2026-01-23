const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672';

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ connected');
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error.message);
      throw error;
    }
  }

  async publishToQueue(queueName, data) {
    try {
      if (!this.channel) {
        await this.initialize();
      }
      
      await this.channel.assertQueue(queueName, { durable: true });
      const message = Buffer.from(JSON.stringify(data));
      this.channel.sendToQueue(queueName, message, { persistent: true });
      
    } catch (error) {
      console.error(`❌ Failed to publish to ${queueName}:`, error.message);
      throw error;
    }
  }

  async consume(queueName, handler) {
    try {
      if (!this.channel) {
        await this.initialize();
      }
      
      await this.channel.assertQueue(queueName, { durable: true });
      
      this.channel.consume(queueName, async (message) => {
        if (message) {
          try {
            const messageData = JSON.parse(message.content.toString());
            await handler(messageData);
            this.channel.ack(message);
          } catch (error) {
            console.error('❌ Message processing failed:', error.message);
            this.channel.nack(message, false, true);
          }
        }
      });
    } catch (error) {
      console.error('❌ Consumer setup failed:', error.message);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('❌ RabbitMQ close failed:', error.message);
    }
  }
}

// Payment confirmation message handler
const processPaymentConfirmed = async (messageData) => {
  const { pool } = require('../config/db');
  const blockchainClient = require('../services/blockchain-client');
  const { title_number, payment_id } = messageData;
  
  try {
    console.log(`📨 Processing payment confirmation for title: ${title_number}`);
    
    // Update land title to ACTIVE
    const result = await pool.query(
      'UPDATE land_titles SET status = $1, updated_at = NOW() WHERE title_number = $2 RETURNING *',
      ['ACTIVE', title_number]
    );
    
    if (result.rows.length > 0) {
      const landTitle = result.rows[0];
      console.log(`🏠 Land title activated: ${title_number}`);
      
      try {
        // Record to blockchain
        const blockchainPayload = {
          title_number: landTitle.title_number,
          owner_name: landTitle.owner_name,
          property_location: landTitle.property_location,
          status: 'ACTIVE',
          reference_id: title_number,
          timestamp: Math.floor(Date.now() / 1000),
          transaction_id: landTitle.transaction_id
        };
        
        const blockchainResponse = await blockchainClient.recordLandTitle(blockchainPayload);
        
        if (blockchainResponse.success && blockchainResponse.blockchainHash) {
          await pool.query(
            'UPDATE land_titles SET blockchain_hash = $1 WHERE title_number = $2',
            [blockchainResponse.blockchainHash, title_number]
          );
          console.log(`🔗 Blockchain hash stored: ${blockchainResponse.blockchainHash}`);
        } else {
          throw new Error('Blockchain recording failed');
        }
      } catch (blockchainError) {
        console.error('❌ Blockchain failed, rolling back land title:', blockchainError.message);
        
        // Rollback land title to PENDING
        await pool.query(
          'UPDATE land_titles SET status = $1 WHERE title_number = $2',
          ['PENDING', title_number]
        );
        
        console.log(`🔄 Land title rollback completed: ${title_number} reverted to PENDING`);
        
        // Send rollback event to Payment Service
        const rollbackMessage = {
          event_type: 'PAYMENT_ROLLBACK_REQUIRED',
          payment_id: payment_id,
          title_number: title_number,
          reason: 'Blockchain recording failed - payment will be marked as FAILED',
          timestamp: new Date().toISOString()
        };
        
        const { QUEUES } = require('../config/constants');
        await rabbitmqService.publishToQueue(QUEUES.PAYMENTS, rollbackMessage);
        console.log(`📨 Rollback event sent to Payment Service for payment: ${payment_id}`);
        
        throw blockchainError;
      }
    }
  } catch (error) {
    console.error('❌ Payment confirmation processing failed:', error.message);
    throw error;
  }
};

// Transfer payment confirmation handler
const processTransferPaymentConfirmed = async (messageData) => {
  const transfersService = require('../services/transfers');
  const { transfer_id, title_number, payment_status } = messageData;
  
  try {
    console.log(`📨 Processing transfer payment confirmation:`);
    console.log(`   Transfer ID: ${transfer_id}`);
    console.log(`   Title Number: ${title_number}`);
    console.log(`   Payment Status: ${payment_status}`);
    
    if (payment_status === 'PAID') {
      // Try to find transfer by transfer_id first, then by title_number
      let transfer = null;
      
      if (transfer_id) {
        try {
          transfer = await transfersService.getTransferById(transfer_id);
          console.log(`✅ Transfer found by ID: ${transfer_id}`);
        } catch (error) {
          console.log(`⚠️ Transfer not found by ID: ${transfer_id}, trying title number...`);
        }
      }
      
      if (!transfer && title_number) {
        try {
          transfer = await transfersService.getTransferByTitleNumber(title_number);
          console.log(`✅ Transfer found by title number: ${title_number}`);
        } catch (error) {
          console.log(`⚠️ Transfer not found by title number: ${title_number}`);
        }
      }
      
      if (transfer) {
        // Process the transfer payment confirmation
        await transfersService.processPaymentConfirmed(messageData);
        console.log(`✅ Transfer payment processed successfully for ${transfer_id || title_number}`);
      } else {
        console.log(`❌ Transfer not found for ID: ${transfer_id}, Title: ${title_number}`);
        throw new Error(`Transfer not found for ID: ${transfer_id}, Title: ${title_number}`);
      }
    } else {
      console.log(`⚠️ Transfer payment not PAID, status: ${payment_status}`);
    }
  } catch (error) {
    console.error('❌ Transfer payment confirmation processing failed:', error.message);
    throw error;
  }
};

// Transfer message handlers
const processTransferCreate = async (messageData) => {
  const transfersService = require('../services/transfers');
  try {
    const result = await transfersService.submitTransfer(messageData.transfer_data);
    console.log('📨 Transfer created successfully:', result.transfer_id);
    return result;
  } catch (error) {
    console.error('❌ Transfer creation failed:', error.message);
    throw error;
  }
};

const processTransferGetAll = async (messageData) => {
  const transfersService = require('../services/transfers');
  try {
    const result = await transfersService.getAllTransfers();
    console.log('📨 All transfers retrieved successfully');
    return result;
  } catch (error) {
    console.error('❌ Get all transfers failed:', error.message);
    throw error;
  }
};

const processTransferGetById = async (messageData) => {
  const transfersService = require('../services/transfers');
  try {
    const result = await transfersService.getTransferById(messageData.transfer_id);
    console.log('📨 Transfer retrieved successfully:', messageData.transfer_id);
    return result;
  } catch (error) {
    console.error('❌ Get transfer by ID failed:', error.message);
    throw error;
  }
};

const processTransferComplete = async (messageData) => {
  const transfersService = require('../services/transfers');
  try {
    const result = await transfersService.updateTransferStatus(messageData.transfer_id, 'COMPLETED');
    console.log('📨 Transfer completed successfully:', messageData.transfer_id);
    return result;
  } catch (error) {
    console.error('❌ Transfer completion failed:', error.message);
    throw error;
  }
};

// Main message processor
const processMessage = async (messageData) => {
  switch (messageData.event_type) {
    case 'PAYMENT_CONFIRMED':
      return await processPaymentConfirmed(messageData);
    case 'TRANSFER_PAYMENT_CONFIRMED':
      return await processTransferPaymentConfirmed(messageData);
    case 'TRANSFER_CREATE':
      return await processTransferCreate(messageData);
    case 'TRANSFER_GET_ALL':
      return await processTransferGetAll(messageData);
    case 'TRANSFER_GET_BY_ID':
      return await processTransferGetById(messageData);
    case 'TRANSFER_COMPLETE':
      return await processTransferComplete(messageData);
    default:
      console.log(`⚠️ Unknown event type: ${messageData.event_type}`);
      return null;
  }
};

const rabbitmqService = new RabbitMQService();
rabbitmqService.processPaymentConfirmed = processPaymentConfirmed;
rabbitmqService.processMessage = processMessage;
module.exports = rabbitmqService;