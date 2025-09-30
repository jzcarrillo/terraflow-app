const rabbitmqService = require('../services/rabbitmqService');
const { QUEUES, EVENT_TYPES } = require('../config/constants');

class EventPublisher {
  
// PUBLISH DOCUMENT UPLOAD EVENT
  static async publishDocumentUpload(data) {
    const eventPayload = {
      event_type: EVENT_TYPES.DOCUMENT_UPLOAD,
      ...data
    };
    
    await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, eventPayload);
  }

// PUBLISH ROLLBACK EVENT
  static async publishRollback(data) {
    const eventPayload = {
      event_type: EVENT_TYPES.ROLLBACK_TRANSACTION,
      ...data
    };
    
    await rabbitmqService.publishToQueue(QUEUES.DOCUMENTS, eventPayload);
  }
}

module.exports = EventPublisher;