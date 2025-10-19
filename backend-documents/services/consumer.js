const amqp = require('amqplib');
const { processDocumentUpload, processLandTitlePaid, processRollbackTransaction, processLandTitleActivated } = require('../processors/document');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

const QUEUE_NAME = QUEUES.DOCUMENTS;
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
          
          console.log(`📨 Document event received: ${event_type}`);
          
          // Route based on event type
          switch (event_type) {
            case EVENT_TYPES.DOCUMENT_UPLOAD:
              await processDocumentUpload(messageData);
              console.log('✅ Document upload processed successfully');
              break;
              
            case EVENT_TYPES.LAND_TITLE_PAID:
              await processLandTitlePaid(messageData);
              console.log('✅ Land title payment processed successfully');
              break;
              
            case EVENT_TYPES.ROLLBACK_TRANSACTION:
              await processRollbackTransaction(messageData);
              console.log('✅ Transaction rollback processed successfully');
              break;
              
            case EVENT_TYPES.LAND_TITLE_ACTIVATED:
              await processLandTitleActivated(messageData);
              console.log('✅ Land title activation processed successfully');
              break;
              
            default:
              console.log(`⚠️ Unknown event type: ${event_type}`);
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