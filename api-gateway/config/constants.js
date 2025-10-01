module.exports = {
  QUEUES: {
    LAND_REGISTRY: 'queue_landregistry',
    DOCUMENTS: 'queue_documents'
  },
  EVENT_TYPES: {
    DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
    DOCUMENT_COMPLETED: 'DOCUMENT_COMPLETED',
    DOCUMENT_FAILED: 'DOCUMENT_FAILED'
  },
  STATUS: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    FAILED: 'FAILED'
  },
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5,
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  CACHE: {
    TTL_SECONDS: 30,
    KEYS: {
      LAND_TITLES_ALL: 'land_titles:all',
      LAND_TITLE_BY_ID: 'land_title:id:'
    }
  }
};