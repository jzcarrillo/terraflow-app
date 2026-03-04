const rabbitmq = require('../utils/rabbitmq');
const landtitles = require('../services/landtitles');
const payments = require('../services/payments');
const transfers = require('../services/transfers');
const mortgage = require('../services/mortgage');
const rollback = require('../services/rollback');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

const messageHandler = async (messageData) => {
  const { event_type, transaction_id, land_title_data } = messageData;
  
  if (event_type) {
    console.log(`\n📨 ===== ${event_type.toUpperCase()} EVENT =====`);
    console.log(`🔑 Transaction: ${transaction_id}`);
  }
  
  switch (event_type) {
    case EVENT_TYPES.DOCUMENT_UPLOADED:
      console.log('📄 Document uploaded - handled by backend-documents service');
      break;
      
    case EVENT_TYPES.DOCUMENT_FAILED:
      await rollback.processDocumentFailed(messageData);
      break;
      
    case EVENT_TYPES.PAYMENT_STATUS_UPDATE:
      await payments.paymentStatusUpdate(messageData);
      break;
      
    case 'PAYMENT_CONFIRMED':
      await rabbitmq.processPaymentConfirmed(messageData);
      break;
      
    case 'TRANSFER_PAYMENT_CONFIRMED':
      await transfers.processPaymentConfirmed(messageData);
      break;
      
    case 'MORTGAGE_PAYMENT_CONFIRMED':
      await payments.processMortgagePaymentConfirmed(messageData);
      break;
      
    case 'MORTGAGE_RELEASE_PAYMENT_CONFIRMED':
      await payments.processMortgageReleasePaymentConfirmed(messageData);
      break;
      
    case 'TRANSFER_CREATE':
    case 'TRANSFER_GET_ALL':
    case 'TRANSFER_GET_BY_ID':
    case 'TRANSFER_COMPLETE':
      await rabbitmq.processMessage(messageData);
      break;
      
    case EVENT_TYPES.ROLLBACK_TRANSACTION:
      await rollback.processRollbackTransaction(messageData);
      break;
      
    default:
      if (messageData.land_title_data) {
        await landtitles.landTitleCreation(messageData);
      } else if (messageData.mortgage_data) {
        await mortgage.createMortgage(messageData);
      } else if (messageData.release_mortgage_data) {
        await mortgage.createReleaseMortgage(messageData.release_mortgage_data);
      }
      break;
  }
};

const startConsumer = async () => {
  try {
    await rabbitmq.consume(QUEUES.LAND_REGISTRY, messageHandler);
  } catch (error) {
    console.error('❌ Consumer start failed:', error.message);
    setTimeout(startConsumer, 10000);
  }
};

module.exports = { startConsumer };