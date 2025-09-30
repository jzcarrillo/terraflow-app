module.exports = {
  QUEUES: {
    DOCUMENTS: 'queue_documents',
    LAND_REGISTRY: 'queue_landregistry'
  },
  EVENT_TYPES: {
    DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_FAILED: 'DOCUMENT_FAILED',
    LAND_TITLE_PAID: 'LAND_TITLE_PAID',
    ROLLBACK_TRANSACTION: 'ROLLBACK_TRANSACTION'
  },
  TABLES: {
    DOCUMENTS: 'documents'
  },
  STATUS: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    FAILED: 'FAILED'
  },
  DOCUMENT_TYPES: {
    TITLE_DEED: 'title_deed',
    SURVEY_PLAN: 'survey_plan',
    TAX_DECLARATION: 'tax_declaration',
    OWNERSHIP_CERTIFICATE: 'ownership_certificate'
  }
};