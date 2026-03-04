const rabbitmq = require('../utils/rabbitmq');
const paymentService = require('../services/payments');
const { validateWithSchema, generatePaymentId } = require('../utils/validation');
const { QUEUES } = require('../config/constants');

const messageHandler = async (messageData) => {
  if (messageData.event_type === 'CREATE_RELEASE_PAYMENT') {
    await handlePaymentCreate({
      ...messageData,
      payment_data: {
        mortgage_id: messageData.mortgage_id,
        reference_type: 'mortgage_release',
        amount: messageData.amount,
        payer_name: messageData.description || 'Mortgage Release',
        payment_method: 'Cash'
      }
    });
  } else if (messageData.action === 'UPDATE_PAYMENT') {
    await handlePaymentUpdate(messageData);
  } else if (messageData.payment_data && !messageData.action) {
    await handlePaymentCreate(messageData);
  } else if (messageData.action === 'UPDATE_STATUS') {
    await handleStatusUpdate(messageData);
  } else if (messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_SUCCESS' || messageData.event_type === 'LAND_TITLE_STATUS_UPDATE_FAILED') {
    await paymentService.handleLandTitleResponse(messageData);
  } else if (messageData.event_type === 'PAYMENT_ROLLBACK_REQUIRED') {
    await handlePaymentRollback(messageData);
  }
};

// CREATE PAYMENT
const handlePaymentCreate = async (messageData) => {
  const { transaction_id, payment_data } = messageData;
  
  // VALIDATE PAYMENT BEFORE CREATE
  console.log(`🔍 ===== VALIDATE PAYMENT =====`);
  console.log(`🔍 Message data:`, JSON.stringify(messageData, null, 2));
  if (payment_data.land_title_id) {
    console.log(`🔍 Checking existing payment for land title: ${payment_data.land_title_id}`);
    console.log(`🔍 Reference type from messageData: ${messageData.reference_type}`);
    console.log(`🔍 Reference type from payment_data: ${payment_data.reference_type}`);
    
    // Check for existing PAID payment (block creation) - Skip for Transfer Title
    if (messageData.reference_type !== 'Transfer Title') {
      const paidPayment = await paymentService.checkLandTitlePaymentExists(payment_data.land_title_id, messageData.reference_type);
      if (paidPayment) {
        console.log(`❌ Payment already PAID for land title ${payment_data.land_title_id} with reference_type ${messageData.reference_type}`);
        throw new Error(`Payment already exists for land title ${payment_data.land_title_id} with reference type ${messageData.reference_type}`);
      }
    } else {
      console.log(`✅ Skipping PAID payment check for Transfer Title`);
    }
    
    // Check for existing PENDING payment (reuse it)
    const pendingPayment = await paymentService.getExistingPendingPayment(payment_data.land_title_id, messageData.reference_type);
    if (pendingPayment) {
      console.log(`🔍 Found existing PENDING payment: ${pendingPayment.payment_id}`);
      console.log(`🔍 Payment details:`, JSON.stringify(pendingPayment, null, 2));
      
      // Don't reuse if this payment was previously failed (has confirmed_at but status is PENDING)
      if (pendingPayment.confirmed_at) {
        console.log(`⚠️ Payment was previously processed and failed, creating new payment instead`);
      } else {
        console.log(`🔄 Reusing existing PENDING payment: ${pendingPayment.payment_id}`);
        return; // Exit early, don't create new payment
      }
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
  // Use transaction ID as reference_id for consistency:
  // - Transfer: transfer_id (TRF-2026-xxx)
  // - Mortgage: mortgage_id (MTG-2026-xxx)  
  // - Land Title: land_title_id (TCT-xxx)
  const paymentData = {
    payment_id: messageData.payment_id || paymentId,
    reference_type: messageData.reference_type,
    reference_id: validatedData.transfer_id || validatedData.mortgage_id || validatedData.land_title_id || messageData.reference_id,
    amount: validatedData.amount,
    payer_name: validatedData.payer_name,
    payment_method: validatedData.payment_method,
    status: 'PENDING',
    created_by: messageData.username || messageData.user_id || 'system',
    transfer_id: validatedData.transfer_id || messageData.transfer_id || null,
    mortgage_id: validatedData.mortgage_id || messageData.mortgage_id || null
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
  const updateData = {};
  
  // Only include fields that exist in database
  if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
  if (validatedData.payment_method !== undefined) updateData.payment_method = validatedData.payment_method;
  if (validatedData.payer_name !== undefined) updateData.payer_name = validatedData.payer_name;
  if (validatedData.reference_type !== undefined) updateData.reference_type = validatedData.reference_type;
  
  // Map land_title_id to reference_id if provided
  if (validatedData.land_title_id) {
    updateData.reference_id = validatedData.land_title_id;
  }
  
  // Handle transfer_id and mortgage_id
  if (validatedData.transfer_id !== undefined) updateData.transfer_id = validatedData.transfer_id;
  if (validatedData.mortgage_id !== undefined) updateData.mortgage_id = validatedData.mortgage_id;
  
  await paymentService.updatePayment(payment_id, updateData);
  
  console.log('✅ Payment details updated successfully');
};

const handleStatusUpdate = async (messageData) => {
  const { payment_id, status, transaction_id, user_id, username } = messageData;
  
  console.log(`\n🔄 ===== UPDATE PAYMENT STATUS =====`);
  console.log(`🔑 Transaction id: ${transaction_id || 'N/A'}`);
  console.log(`🔄 Action: "UPDATE_STATUS",`);
  
  // GET PAYMENT DETAILS  BY PAYMENT_ID STRING
  const currentPayment = await paymentService.getPaymentByPaymentId(payment_id);
  
  // CREATE COMPLETE PAYLOAD FOR LOGGING
  const completePayload = {
    payment_id: payment_id,
    reference_id: currentPayment?.reference_id || 'N/A',
    amount: currentPayment?.amount || 0,
    payer_name: currentPayment?.payer_name || 'N/A',
    status: status,
    user_id: user_id,
    username: username || 'system',
  };
  
  console.log('📦 Request Payload:', JSON.stringify(completePayload, null, 2));
  
  await paymentService.updatePaymentStatusByPaymentId(payment_id, status, user_id, transaction_id);

  console.log('📤 Message published to queue_landregistry');
};

const handlePaymentRollback = async (messageData) => {
  const { title_number, reason } = messageData;
  
  console.log(`\n🔄 ===== PAYMENT ROLLBACK =====`);
  console.log(`🏠 Title: ${title_number}`);
  console.log(`ℹ️ Reason: ${reason}`);
  
  try {
    // Find payment by title_number and rollback to PENDING
    await paymentService.rollbackPaymentByTitle(title_number);
    console.log(`✅ Payment rollback completed for title: ${title_number}`);
  } catch (error) {
    console.error(`❌ Payment rollback failed for title ${title_number}:`, error.message);
  }
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