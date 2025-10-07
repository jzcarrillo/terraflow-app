const amqp = require('amqplib');
const landtitles = require('../services/landtitles');
const documents = require('../services/documents');
const payments = require('../services/payments');
const rollback = require('../services/rollback');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

const QUEUE_NAME = QUEUES.LAND_REGISTRY;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672';

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log(`✅ Connected to RabbitMQ - queue: ${QUEUE_NAME}`);
      return true;
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error.message);
      return false;
    }
  }

  async startConsumer() {
    
    const connected = await this.connect();
    if (!connected) {
      console.log('Retrying RabbitMQ connection in 10 seconds...');
      setTimeout(() => this.startConsumer(), 10000);
      return;
    }


    
    this.channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const messageData = JSON.parse(message.content.toString());
          const { event_type } = messageData;
          
          console.log(`📨 Received event: ${event_type || 'LAND_TITLE_CREATE'}`);
          
          // Route messages to appropriate handlers
          switch (event_type) {
            case EVENT_TYPES.DOCUMENT_UPLOADED:
              console.log(`✅ Documents completed for land title: ${messageData.land_title_id}`);
              await documents.processDocumentUploaded(messageData);
              break;
              
            case EVENT_TYPES.DOCUMENT_FAILED:
              console.log(`❌ Documents failed for land title: ${messageData.land_title_id}`);
              await rollback.processDocumentFailed(messageData);
              break;
              
            case EVENT_TYPES.PAYMENT_STATUS_UPDATE:
              console.log(`💳 Payment status update for transaction: ${messageData.transaction_id}`);
              await payments.paymentStatusUpdate(messageData);
              break;
              
            case EVENT_TYPES.ROLLBACK_TRANSACTION:
              console.log(`🔄 Rollback transaction for land title: ${messageData.land_title_id}`);
              await rollback.processRollbackTransaction(messageData);
              break;
              
            default:
              // Land title creation (no event_type means create request)
              if (messageData.land_title_data) {
                await landtitles.landTitleCreation(messageData);
              } else {
                console.log('⚠️ Unknown message type:', messageData);
              }
              break;
          }
          
          this.channel.ack(message);
          
        } catch (error) {
          console.error('❌ Message processing failed:', error.message);
          this.channel.nack(message, false, true);
        }
      }
    });
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error.message);
    }
  }
}

const consumer = new RabbitMQConsumer();
module.exports = consumer;