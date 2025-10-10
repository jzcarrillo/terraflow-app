const amqp = require('amqplib');
const { paymentCreate, paymentUpdate, paymentStatusUpdate } = require('../processors/payments');
const { QUEUES } = require('../config/constants');

const QUEUE_NAME = QUEUES.PAYMENTS;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672';

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      // Add timeout to prevent hanging
      this.connection = await Promise.race([
        amqp.connect(RABBITMQ_URL),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
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


// START CONSUME
    this.channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const messageData = JSON.parse(message.content.toString());
          
          if (messageData.action === 'UPDATE_PAYMENT') {
            console.log('✏️ === UPDATE PAYMENT REQUEST ===');
            await paymentUpdate(messageData);
          } else if (messageData.payment_data && !messageData.action) {
            await paymentCreate(messageData);
          } else if (messageData.action === 'UPDATE_STATUS') {
            await paymentStatusUpdate(messageData);
          } else if (messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_SUCCESS') {
            console.log('✅ === LAND TITLE STATUS UPDATE SUCCESS ===');
            console.log(`🏠 Land title ${messageData.title_number} status updated to ${messageData.new_status} for reference: ${messageData.reference_id}`);
          } else if (messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_FAILED') {
            console.log('❌ === LAND TITLE STATUS UPDATE FAILED ===');
            console.log(`⚠️ Land title update failed for reference: ${messageData.reference_id} - ${messageData.error}`);
          } else {
            console.log('⚠️ Unknown message type:', messageData);
          }
          
          this.channel.ack(message);
          
        } catch (error) {
          console.error('❌ Message processing failed:', error.message);
          console.error('Error stack:', error.stack);
          // Don't requeue to prevent infinite loop
          this.channel.nack(message, false, false);
        }
      } else {
        console.log('Received null message');
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