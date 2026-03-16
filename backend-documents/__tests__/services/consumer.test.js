jest.mock('../../utils/rabbitmq', () => ({
  publishToQueue: jest.fn().mockResolvedValue(),
  consume: jest.fn().mockResolvedValue()
}));
jest.mock('../../services/document', () => ({
  createDocument: jest.fn(),
  updateDocumentStatusByLandTitle: jest.fn().mockResolvedValue(),
  deleteDocumentsByTransactionId: jest.fn()
}));
jest.mock('../../utils/fileHandler', () => ({
  saveFile: jest.fn(),
  deleteFile: jest.fn().mockResolvedValue(),
  getFileExtension: jest.fn(name => name.split('.').pop())
}));
jest.mock('../../config/constants', () => ({
  QUEUES: { DOCUMENTS: 'queue_documents', LAND_REGISTRY: 'queue_landregistry' },
  EVENT_TYPES: {
    DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_FAILED: 'DOCUMENT_FAILED',
    LAND_TITLE_PAID: 'LAND_TITLE_PAID',
    LAND_TITLE_ACTIVATED: 'LAND_TITLE_ACTIVATED',
    ROLLBACK_TRANSACTION: 'ROLLBACK_TRANSACTION'
  }
}));

const rabbitmq = require('../../utils/rabbitmq');
const documentService = require('../../services/document');
const { saveFile, deleteFile } = require('../../utils/fileHandler');
const { startConsumer } = require('../../services/consumer');

describe('Consumer Service', () => {
  let messageHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    rabbitmq.consume.mockImplementation(async (queue, handler) => {
      messageHandler = handler;
    });
  });

  it('should start consumer and register handler', async () => {
    await startConsumer();
    expect(rabbitmq.consume).toHaveBeenCalledWith('queue_documents', expect.any(Function));
  });

  describe('DOCUMENT_UPLOAD', () => {
    it('should handle document upload for land title', async () => {
      await startConsumer();

      saveFile.mockResolvedValue('/uploads/landtitle_1_deed_123.pdf');
      documentService.createDocument.mockResolvedValue({ id: 'doc-1', file_path: '/uploads/landtitle_1_deed_123.pdf' });

      await messageHandler({
        event_type: 'DOCUMENT_UPLOAD',
        transaction_id: 'TXN-001',
        land_title_id: 1,
        mortgage_id: null,
        user_id: 'user1',
        attachments: [{
          original_name: 'deed.pdf',
          document_type: 'deed',
          buffer: Buffer.from('test').toString('base64'),
          size: 1024,
          mime_type: 'application/pdf'
        }]
      });

      expect(saveFile).toHaveBeenCalled();
      expect(documentService.createDocument).toHaveBeenCalledWith(expect.objectContaining({
        land_title_id: 1,
        mortgage_id: null,
        reference_type: 'land_title'
      }));
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_landregistry', expect.objectContaining({
        event_type: 'DOCUMENT_UPLOADED',
        total_documents: 1
      }));
    });

    it('should handle document upload for mortgage', async () => {
      await startConsumer();

      saveFile.mockResolvedValue('/uploads/mortgage_5_deed_123.pdf');
      documentService.createDocument.mockResolvedValue({ id: 'doc-1', file_path: '/uploads/mortgage_5_deed_123.pdf' });

      await messageHandler({
        event_type: 'DOCUMENT_UPLOAD',
        transaction_id: 'TXN-002',
        land_title_id: 1,
        mortgage_id: 5,
        user_id: 'user1',
        attachments: [{
          original_name: 'mortgage.pdf',
          document_type: 'mortgage_doc',
          buffer: Buffer.from('test').toString('base64'),
          size: 2048,
          mime_type: 'application/pdf'
        }]
      });

      expect(documentService.createDocument).toHaveBeenCalledWith(expect.objectContaining({
        land_title_id: null,
        mortgage_id: 5,
        reference_type: 'mortgage'
      }));
    });

    it('should cleanup and publish failure on upload error', async () => {
      await startConsumer();

      saveFile.mockResolvedValueOnce('/uploads/file1.pdf');
      documentService.createDocument
        .mockResolvedValueOnce({ id: 'doc-1', file_path: '/uploads/file1.pdf' })
        .mockRejectedValueOnce(new Error('DB error'));

      await messageHandler({
        event_type: 'DOCUMENT_UPLOAD',
        transaction_id: 'TXN-001',
        land_title_id: 1,
        mortgage_id: null,
        user_id: 'user1',
        attachments: [
          { original_name: 'file1.pdf', document_type: 'deed', buffer: Buffer.from('a').toString('base64'), size: 100, mime_type: 'application/pdf' },
          { original_name: 'file2.pdf', document_type: 'tax', buffer: Buffer.from('b').toString('base64'), size: 200, mime_type: 'application/pdf' }
        ]
      });

      expect(deleteFile).toHaveBeenCalledWith('/uploads/file1.pdf');
      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_landregistry', expect.objectContaining({
        event_type: 'DOCUMENT_FAILED'
      }));
    });
  });

  describe('LAND_TITLE_PAID / LAND_TITLE_ACTIVATED', () => {
    it('should activate documents on LAND_TITLE_PAID', async () => {
      await startConsumer();

      await messageHandler({
        event_type: 'LAND_TITLE_PAID',
        land_title_id: 1
      });

      expect(documentService.updateDocumentStatusByLandTitle).toHaveBeenCalledWith(1, 'ACTIVE');
    });

    it('should activate documents on LAND_TITLE_ACTIVATED', async () => {
      await startConsumer();

      await messageHandler({
        event_type: 'LAND_TITLE_ACTIVATED',
        land_title_id: 2
      });

      expect(documentService.updateDocumentStatusByLandTitle).toHaveBeenCalledWith(2, 'ACTIVE');
    });
  });

  describe('ROLLBACK_TRANSACTION', () => {
    it('should delete documents and files on rollback', async () => {
      await startConsumer();

      documentService.deleteDocumentsByTransactionId.mockResolvedValue([
        { file_path: '/uploads/file1.pdf' },
        { file_path: '/uploads/file2.pdf' }
      ]);

      await messageHandler({
        event_type: 'ROLLBACK_TRANSACTION',
        transaction_id: 'TXN-001'
      });

      expect(documentService.deleteDocumentsByTransactionId).toHaveBeenCalledWith('TXN-001');
      expect(deleteFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('startConsumer error', () => {
    it('should retry on consumer start failure', async () => {
      jest.useFakeTimers();
      rabbitmq.consume.mockRejectedValueOnce(new Error('Connection failed'));

      await startConsumer();

      expect(rabbitmq.consume).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
});
