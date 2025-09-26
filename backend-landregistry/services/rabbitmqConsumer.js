const amqp = require('amqplib');
const { processLandTitleCreation } = require('../processors/landTitleProcessor');
const { QUEUES } = require('../config/constants');

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
      
      console.log(`✅ Connected to RabbitMQ - Queue: ${QUEUE_NAME}`);
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

    console.log('✅ Consumer connected successfully');
    
    this.channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          console.log('📋 ===CREATE LAND TITLE REQUEST ===');
          const messageData = JSON.parse(message.content.toString());
          console.log('📦 Consumed data:', messageData);
          
          console.log('⚙️ Processing land title creation');
          await processLandTitleCreation(messageData);
          
          this.channel.ack(message);
          console.log('✅ Land title processed / acknowledged successfully.');
          
        } catch (error) {
          console.error('❌ Message processing failed:', error.message);
          console.error('Error stack:', error.stack);
          this.channel.nack(message, false, true);
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

const rabbitmqConsumer = new RabbitMQConsumer();
module.exports = rabbitmqConsumer;