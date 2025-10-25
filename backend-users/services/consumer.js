const rabbitmq = require('../utils/rabbitmq');
const userService = require('../services/users');
const { checkEmailExists } = require('../utils/validation');
const { QUEUES } = require('../config/constants');

const messageHandler = async (messageData) => {
  console.log('📨 === USER CREATE ===');
  console.log('📦 Consumed data:', JSON.stringify(messageData, null, 2));
  
  const { transaction_id, user_data } = messageData;
  
  if (messageData.user_data) {
    console.log(`🔍 Checking if email exists: ${user_data.email_address}`);
    const exists = await checkEmailExists(user_data.email_address);
    if (exists) {
      console.log(`❌ Email already exists: ${user_data.email_address}`);
      throw new Error(`Email address ${user_data.email_address} already exists in database`);
    }

    console.log(`✅ Creating user: ${user_data.username}`);
    await userService.createUser({
      ...user_data,
      transaction_id: transaction_id,
      status: 'ACTIVE'
    });
    console.log(`✅ User created successfully: ${user_data.username}`);
  }
};

const startConsumer = async () => {
  try {
    await rabbitmq.consume(QUEUES.USERS, messageHandler);
    console.log(`✅ Consumer started for queue: ${QUEUES.USERS}`);
  } catch (error) {
    console.error('❌ Consumer start failed:', error.message);
    setTimeout(startConsumer, 10000);
  }
};

module.exports = { startConsumer };