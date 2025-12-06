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
          reason: 'Blockchain recording failed',
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

const rabbitmqService = new RabbitMQService();
rabbitmqService.processPaymentConfirmed = processPaymentConfirmed;
module.exports = rabbitmqService;