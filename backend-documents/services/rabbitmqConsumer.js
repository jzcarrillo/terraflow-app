const rabbitmqService = require('./rabbitmqService');
const { processDocumentUpload, processLandTitlePaid, processRollbackTransaction } = require('../processors/documentProcessor');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

class RabbitMQConsumer {
  async startConsumer() {
    try {

      
      // Start consumer for document events
      await rabbitmqService.startConsumer(QUEUES.DOCUMENTS, async (messageData) => {
        const { event_type } = messageData;
        
        console.log(`📨 Document event received: ${event_type}`);
        
        // Route based on event type
        switch (event_type) {
          case EVENT_TYPES.DOCUMENT_UPLOAD:
            await processDocumentUpload(messageData);
            console.log('✅ Document upload processed successfully');
            break;
            
          case EVENT_TYPES.LAND_TITLE_PAID:
            await processLandTitlePaid(messageData);
            console.log('✅ Land title payment processed successfully');
            break;
            
          case EVENT_TYPES.ROLLBACK_TRANSACTION:
            await processRollbackTransaction(messageData);
            console.log('✅ Transaction rollback processed successfully');
            break;
            
          default:
            console.log(`⚠️ Unknown event type: ${event_type}`);
        }
      });
      
      console.log('✅ Consumer connected successfully');
      
    } catch (error) {
      console.error('❌ Failed to start Backend Documents consumers:', error);
      throw error;
    }
  }
}

const rabbitmqConsumer = new RabbitMQConsumer();
module.exports = rabbitmqConsumer;