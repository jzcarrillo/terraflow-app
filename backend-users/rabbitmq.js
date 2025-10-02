const amqp = require('amqplib');
require('dotenv').config();

let channel;

const connectRabbitMQ = async (createUserInDB) => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq-service:5672');
    channel = await connection.createChannel();
    
    await channel.assertQueue('queue_users', { durable: true });
    
    // Consumer for user creation
    channel.consume('queue_users', async (msg) => {
      if (msg) {
        try {
          const userData = JSON.parse(msg.content.toString());
          await createUserInDB(userData);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing user creation:', error);
          channel.nack(msg, false, false);
        }
      }
    });
    
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    setTimeout(() => connectRabbitMQ(createUserInDB), 5000);
  }
};

module.exports = { connectRabbitMQ };