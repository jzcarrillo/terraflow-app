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

const rabbitmqService = new RabbitMQService();
module.exports = rabbitmqService;