const constants = require('../../config/constants');

describe('Constants', () => {
  it('should export QUEUES', () => {
    expect(constants.QUEUES.DOCUMENTS).toBe('queue_documents');
    expect(constants.QUEUES.LAND_REGISTRY).toBe('queue_landregistry');
  });

  it('should export EVENT_TYPES', () => {
    expect(constants.EVENT_TYPES.DOCUMENT_UPLOAD).toBe('DOCUMENT_UPLOAD');
    expect(constants.EVENT_TYPES.DOCUMENT_UPLOADED).toBe('DOCUMENT_UPLOADED');
    expect(constants.EVENT_TYPES.DOCUMENT_FAILED).toBe('DOCUMENT_FAILED');
    expect(constants.EVENT_TYPES.ROLLBACK_TRANSACTION).toBe('ROLLBACK_TRANSACTION');
  });

  it('should export TABLES', () => {
    expect(constants.TABLES.DOCUMENTS).toBe('documents');
  });

  it('should export STATUS', () => {
    expect(constants.STATUS.PENDING).toBe('PENDING');
    expect(constants.STATUS.ACTIVE).toBe('ACTIVE');
    expect(constants.STATUS.FAILED).toBe('FAILED');
  });

  it('should export DOCUMENT_TYPES', () => {
    expect(constants.DOCUMENT_TYPES.TITLE_DEED).toBe('title_deed');
    expect(constants.DOCUMENT_TYPES.SURVEY_PLAN).toBe('survey_plan');
  });
});
