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

    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
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
      console.error(`❌ Failed to publish to ${queueName}:`, error);
      throw error;
    }
  }


}

const rabbitmqService = new RabbitMQService();
module.exports = rabbitmqService;