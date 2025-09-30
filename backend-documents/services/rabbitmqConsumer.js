const rabbitmqService = require('./rabbitmqService');
const { processDocumentUpload } = require('../processors/documentProcessor');
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
            
          default:
            console.log(`⚠️ Unknown event type: ${event_type}`);
        }
      });
      

      
    } catch (error) {
      console.error('❌ Failed to start Backend Documents consumers:', error);
      throw error;
    }
  }
}

const rabbitmqConsumer = new RabbitMQConsumer();
module.exports = rabbitmqConsumer;