const amqp = require('amqplib');
const config = require('../config/services');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect(config.rabbitmq.url);
        this.channel = await this.connection.createChannel();
        console.log('✅ Connected to RabbitMQ successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error.message);
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
      
      console.log(`📤 Message published to queue ${queueName}`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to publish message:', error.message);
      throw error;
    }
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