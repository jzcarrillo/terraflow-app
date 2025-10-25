const rabbitmq = require('../utils/rabbitmq');
const paymentService = require('../services/payments');
const { validateWithSchema, generatePaymentId } = require('../utils/validation');
const { QUEUES } = require('../config/constants');

const messageHandler = async (messageData) => {
  if (messageData.action === 'UPDATE_PAYMENT') {
    await handlePaymentUpdate(messageData);
  } else if (messageData.payment_data && !messageData.action) {
    await handlePaymentCreate(messageData);
  } else if (messageData.action === 'UPDATE_STATUS') {
    await handleStatusUpdate(messageData);
  } else if (messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_SUCCESS' || messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_FAILED') {
    await paymentService.handleLandTitleResponse(messageData);
  }
};

// CREATE PAYMENT
const handlePaymentCreate = async (messageData) => {
  const { transaction_id, payment_data } = messageData;
  
  // VALIDATE PAYMENT BEFORE CREATE
  console.log(`🔍 ===== VALIDATE PAYMENT =====`);
  if (payment_data.land_title_id) {
    console.log(`🔍 Checking existing payment for land title: ${payment_data.land_title_id}`);
    const existingPayment = await paymentService.checkLandTitlePaymentExists(payment_data.land_title_id);

    if (existingPayment) {
      console.log(`❌ Payment already exists for land title ${payment_data.land_title_id}`);
      throw new Error(`Payment already exists for land title ${payment_data.land_title_id}`);
    }
    console.log(`✅ No existing payment for land title ${payment_data.land_title_id}`);
  }
  
  console.log(`\n💳 ===== CREATE PAYMENT =====`);
  console.log(`🔑 Transaction id: ${transaction_id}`);
  
  // ZOD VALIDATION
  const { paymentSchema } = require('../schemas/payments');
  const validatedData = validateWithSchema(paymentSchema, payment_data);
  
  // CREATE COMPLETE PAYLOAD FOR LOGGING
  const completePayload = {
    payment_id: messageData.payment_id || 'Generated',
    land_title_id: validatedData.land_title_id,
    reference_type: messageData.reference_type,
    amount: validatedData.amount,
    payment_method: validatedData.payment_method,
    payer_name: validatedData.payer_name,
    status: 'PENDING'
  };
  
  console.log('📦 Request Payload:');
  console.log(JSON.stringify(completePayload, null, 2));
  console.log('\n✅ Zod validation successful for Create Payment'); 
  
  const paymentId = generatePaymentId();
  const isDuplicate = await paymentService.checkPaymentExists(paymentId);
  
  if (isDuplicate) {
    console.log(`❌ FAILED: Payment ID ${paymentId} already exists`);
    throw new Error(`Payment ID ${paymentId} already exists`);
  }
  
  // Map field names to match database schema
  const paymentData = {
    payment_id: messageData.payment_id || paymentId,
    reference_type: messageData.reference_type,
    reference_id: validatedData.land_title_id,
    amount: validatedData.amount,
    payer_name: validatedData.payer_name,
    payment_method: validatedData.payment_method,
    status: 'PENDING',
    created_by: messageData.username || messageData.user_id || 'system'
  };
  
  await paymentService.createPayment(paymentData);
  
};

const handlePaymentUpdate = async (messageData) => {
  const { payment_id, payment_data, transaction_id } = messageData;
  
  console.log(`\n✏️ ===== EDIT PAYMENT DETAILS =====`);
  console.log(`🔑 Transaction: ${transaction_id}`);
  
  const { paymentEditSchema } = require('../schemas/payments');
  const validatedData = validateWithSchema(paymentEditSchema, payment_data);
  
  console.log('📦 Request Payload:');
  console.log(JSON.stringify(validatedData, null, 2));
  console.log('\n✅ Zod validation successful for Edit Payment');
  
  // Map field names to match database schema
  const updateData = { ...validatedData };
  if (updateData.land_title_id) {
    updateData.reference_id = updateData.land_title_id;
    delete updateData.land_title_id;
  }
  
  await paymentService.updatePayment(payment_id, updateData);
  
  console.log('✅ Payment details updated successfully');
};

const handleStatusUpdate = async (messageData) => {
  const { payment_id, status, transaction_id, user_id, username } = messageData;
  
  console.log(`\n🔄 ===== UPDATE PAYMENT STATUS =====`);
  console.log(`🔑 Transaction id: ${transaction_id || 'N/A'}`);
  console.log(`🔄 Action: "UPDATE_STATUS",`);
  
  // GET PAYMENT DETAILS FROM DATABASE
  const currentPayment = await paymentService.getPaymentById(payment_id);
  
  // CREATE COMPLETE PAYLOAD FOR LOGGING
  const completePayload = {
    payment_id: payment_id,
    reference_id: currentPayment?.reference_id || 'N/A',
    amount: currentPayment?.amount || 0,
    payer_name: currentPayment?.payer_name || 'N/A',
    status: status,
    user_id: user_id,
    username: username || 'system',
    timestamp: new Date().toISOString()
  };
  
  console.log('📦 Request Payload:', JSON.stringify(completePayload, null, 2));
  
  await paymentService.updatePaymentStatus(payment_id, status, user_id, transaction_id);

  console.log('📤 Message published to queue_landregistry');
};

const startConsumer = async () => {
  try {
    await rabbitmq.consume(QUEUES.PAYMENTS, messageHandler);
  } catch (error) {
    console.error('❌ Consumer start failed:', error.message);
    setTimeout(startConsumer, 10000);
  }
};

module.exports = { startConsumer };