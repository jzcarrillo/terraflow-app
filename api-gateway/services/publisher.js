const amqp = require('amqplib');
const config = require('../config/services');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      if (!this.connection || this.connection.connection.destroyed) {
        this.connection = await amqp.connect(config.rabbitmq.url);
        this.channel = await this.connection.createChannel();
        
        // Handle connection errors
        this.connection.on('error', (err) => {
          console.error('❌ RabbitMQ connection error:', err.message);
          this.connection = null;
          this.channel = null;
        });
        
        console.log('✅ Connected to RabbitMQ successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error.message);
      this.connection = null;
      this.channel = null;
      return false;
    }
  }

// PUBLISH EVENT TO QUEUE
  async publishToQueue(queueName, message) {
    try {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('RabbitMQ connection unavailable');
      }

      await this.channel.assertQueue(queueName, { durable: true });
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.sendToQueue(queueName, messageBuffer, { persistent: true });
      

      return true;
      
    } catch (error) {
      console.error('❌ Failed to publish message:', error.message);
      throw error;
    }
  }

// PUBLISH LAND REGISTRY STATUS UPDATE (PAID -> ACTIVE)
  async publishLandRegistryStatusUpdate(paymentData) {
    const { QUEUES, EVENT_TYPES } = require('../config/constants');
    const message = {
      event_type: EVENT_TYPES.PAYMENT_STATUS_UPDATE,
      payment_id: paymentData.payment_id,
      reference_id: paymentData.reference_id,
      status: 'ACTIVE',
      payment_status: 'PAID',
      timestamp: new Date().toISOString()
    };

    const result = await this.publishToQueue(QUEUES.LAND_REGISTRY, message);
    if (result) {
      console.log('📤 Message published to message queue: queue_landregistry');
    }
    return result;
  }

// PUBLISH LAND REGISTRY REVERT UPDATE (CANCELLED -> PENDING)
  async publishLandRegistryRevertUpdate(paymentData) {
    const { QUEUES, EVENT_TYPES } = require('../config/constants');
    const message = {
      event_type: EVENT_TYPES.PAYMENT_STATUS_UPDATE,
      payment_id: paymentData.payment_id,
      reference_id: paymentData.reference_id,
      status: 'PENDING',
      payment_status: 'CANCELLED',
      timestamp: new Date().toISOString()
    };

    const result = await this.publishToQueue(QUEUES.LAND_REGISTRY, message);
    if (result) {
      console.log('📤 Message published to message queue: queue_landregistry');
    }
    return result;
  }

  async initialize() {
    await this.connect();
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error.message);
    }
  }
}

const rabbitmqService = new RabbitMQService();
module.exports = rabbitmqService;