const amqp = require('amqplib');
const { QUEUES } = require('../config/constants');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq-service:5672';

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
// ASSERT QUEUE
      await this.channel.assertQueue(QUEUES.LAND_REGISTRY, { durable: true });
      
      console.log('✅ Publisher connected to RabbitMQ');
      return true;
    } catch (error) {
      console.error('❌ Publisher RabbitMQ connection failed:', error.message);
      return false;
    }
  }

// PUBLISH TO QUEUE
  async publishToQueue(queueName, message) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(queueName, messageBuffer, { persistent: true });
      
      console.log(`📤 Published message to ${queueName}:`, message);
      return true;
    } catch (error) {
      console.error(`❌ Failed to publish to ${queueName}:`, error.message);
      return false;
    }
  }



  async publishLandRegistryStatusUpdate(paymentData) {
    const message = {
      event_type: 'PAYMENT_STATUS_UPDATE',
      payment_id: paymentData.id,
      reference_id: paymentData.reference_id,
      status: 'ACTIVE',
      payment_status: paymentData.status,
      timestamp: new Date().toISOString()
    };

    return await this.publishToQueue(QUEUES.LAND_REGISTRY, message);
  }

  async publishLandRegistryRevertUpdate(paymentData) {
    const message = {
      event_type: 'PAYMENT_STATUS_UPDATE',
      payment_id: paymentData.id,
      reference_id: paymentData.reference_id,
      status: 'PENDING',
      payment_status: paymentData.status,
      timestamp: new Date().toISOString()
    };

    return await this.publishToQueue(QUEUES.LAND_REGISTRY, message);
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
      console.error('Error closing publisher connection:', error.message);
    }
  }
}

const publisher = new RabbitMQPublisher();
module.exports = publisher;