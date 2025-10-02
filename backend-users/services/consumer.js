const amqp = require('amqplib');
const { processUserCreation } = require('../processors/userProcessor');
const { QUEUES } = require('../config/constants');

const QUEUE_NAME = QUEUES.USERS;
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

    console.log('✅ Consumer connected successfully - queue: queue_users');
    
    this.channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const messageData = JSON.parse(message.content.toString());
          
          if (messageData.user_data) {
            console.log('👤 ===CREATE USER REQUEST ===');
            console.log('📦 Consumed data:', messageData);
            
            console.log('⚙️ Processing user creation');
            await processUserCreation(messageData);
            
            console.log('✅ User processed / acknowledged successfully.');
          } else {
            console.log('⚠️ Unknown message type:', messageData);
          }
          
          this.channel.ack(message);
          
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

const consumer = new RabbitMQConsumer();
module.exports = consumer;