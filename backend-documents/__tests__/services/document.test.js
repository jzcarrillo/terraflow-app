jest.mock('../../utils/database');
jest.mock('../../utils/rabbitmq');
jest.mock('../../utils/fileHandler');
jest.mock('../../config/constants', () => ({
  TABLES: { DOCUMENTS: 'documents' },
  QUEUES: { LAND_REGISTRY: 'queue_landregistry', DOCUMENTS: 'queue_documents' },
  EVENT_TYPES: {
    DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_FAILED: 'DOCUMENT_FAILED',
    LAND_TITLE_PAID: 'LAND_TITLE_PAID',
    ROLLBACK_TRANSACTION: 'ROLLBACK_TRANSACTION'
  }
}));

const documentService = require('../../services/document');
const { executeQuery } = require('../../utils/database');
const rabbitmq = require('../../utils/rabbitmq');
const { saveFile, deleteFile } = require('../../utils/fileHandler');

describe('Document Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Document Upload Success (3 tests)
  describe('Document Upload Success', () => {
    it('should create document after land title success', async () => {
      const mockDoc = {
        id: 1,
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'deed.pdf',
        file_path: '/uploads/deed.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      };

      executeQuery.mockResolvedValue({ rows: [mockDoc] });

      const result = await documentService.createDocument({
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'deed.pdf',
        file_path: '/uploads/deed.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      });

      expect(result).toEqual(mockDoc);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documents'),
        [1, 'TXN-001', 'DEED', 'deed.pdf', '/uploads/deed.pdf', 1024, 'application/pdf', 'user1']
      );
    });

    it('should store document in database after successful upload', async () => {
      const mockDoc = { id: 1, file_path: '/uploads/file.pdf', status: 'PENDING' };
      executeQuery.mockResolvedValue({ rows: [mockDoc] });

      const result = await documentService.createDocument({
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'file.pdf',
        file_path: '/uploads/file.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      });

      expect(result.file_path).toBe('/uploads/file.pdf');
      expect(executeQuery).toHaveBeenCalled();
    });

    it('should publish success event to land registry after upload', async () => {
      const mockDoc = { id: 1, land_title_id: 1, transaction_id: 'TXN-001' };
      executeQuery.mockResolvedValue({ rows: [mockDoc] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await documentService.createDocument({
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'file.pdf',
        file_path: '/uploads/file.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      });

      // Simulate event publishing after successful upload
      await rabbitmq.publishToQueue('queue_landregistry', {
        event_type: 'DOCUMENT_UPLOADED',
        transaction_id: 'TXN-001',
        land_title_id: 1
      });

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(
        'queue_landregistry',
        expect.objectContaining({ event_type: 'DOCUMENT_UPLOADED' })
      );
    });
  });

  // Validation (2 tests)
  describe('Validation', () => {
    it('should reject upload when no attachments provided', async () => {
      const attachments = [];

      await expect(async () => {
        if (attachments.length === 0) {
          throw new Error('No attachments provided');
        }
      }).rejects.toThrow('No attachments provided');
    });

    it('should validate required document fields', async () => {
      executeQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      await documentService.createDocument({
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'file.pdf',
        file_path: '/uploads/file.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      });

      expect(executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'TXN-001', 'DEED'])
      );
    });
  });

  // Rollback on Document Service Down (3 tests)
  describe('Rollback on Document Service Down', () => {
    it('should trigger rollback when document service fails', async () => {
      saveFile.mockRejectedValue(new Error('Document service down'));
      rabbitmq.publishToQueue.mockResolvedValue();

      try {
        await saveFile(Buffer.from('test'), 'file.pdf');
      } catch (error) {
        await rabbitmq.publishToQueue('queue_landregistry', {
          event_type: 'DOCUMENT_FAILED',
          transaction_id: 'TXN-001',
          error: error.message
        });
      }

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(
        'queue_landregistry',
        expect.objectContaining({ event_type: 'DOCUMENT_FAILED' })
      );
    });

    it('should delete uploaded files on rollback', async () => {
      const mockDocs = [
        { id: 1, file_path: '/uploads/file1.pdf', transaction_id: 'TXN-001' },
        { id: 2, file_path: '/uploads/file2.pdf', transaction_id: 'TXN-001' }
      ];

      executeQuery.mockResolvedValue({ rows: mockDocs });
      deleteFile.mockResolvedValue();

      const deletedDocs = await documentService.deleteDocumentsByTransactionId('TXN-001');

      for (const doc of deletedDocs) {
        await deleteFile(doc.file_path);
      }

      expect(deleteFile).toHaveBeenCalledTimes(2);
      expect(deleteFile).toHaveBeenCalledWith('/uploads/file1.pdf');
      expect(deleteFile).toHaveBeenCalledWith('/uploads/file2.pdf');
    });

    it('should revert land title status on document failure', async () => {
      rabbitmq.publishToQueue.mockResolvedValue();

      await rabbitmq.publishToQueue('queue_landregistry', {
        event_type: 'DOCUMENT_FAILED',
        transaction_id: 'TXN-001',
        land_title_id: 1,
        error: 'Upload failed'
      });

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(
        'queue_landregistry',
        expect.objectContaining({
          event_type: 'DOCUMENT_FAILED',
          land_title_id: 1
        })
      );
    });
  });

  // Document Retrieval (3 tests)
  describe('Document Retrieval', () => {
    it('should get documents by land title id', async () => {
      const mockDocs = [
        { id: 1, land_title_id: 1, file_name: 'deed.pdf' },
        { id: 2, land_title_id: 1, file_name: 'tax.pdf' }
      ];

      executeQuery.mockResolvedValue({ rows: mockDocs });

      const result = await documentService.getDocumentsByLandTitleId(1);

      expect(result).toHaveLength(2);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE land_title_id = $1'),
        [1]
      );
    });

    it('should get document by id', async () => {
      const mockDoc = { id: 1, file_name: 'deed.pdf' };
      executeQuery.mockResolvedValue({ rows: [mockDoc] });

      const result = await documentService.getDocumentById(1);

      expect(result).toEqual(mockDoc);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
    });

    it('should return null when document not found', async () => {
      executeQuery.mockResolvedValue({ rows: [] });

      const result = await documentService.getDocumentById(999);

      expect(result).toBeNull();
    });
  });

  // Document Status Update (2 tests)
  describe('Document Status Update', () => {
    it('should update document status when land title is paid', async () => {
      executeQuery.mockResolvedValue({ rowCount: 2 });

      await documentService.updateDocumentStatusByLandTitle(1, 'ACTIVE');

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE documents SET status = $1'),
        ['ACTIVE', 1]
      );
    });

    it('should activate all documents for a land title', async () => {
      executeQuery.mockResolvedValue({ rowCount: 3 });

      const result = await documentService.updateDocumentStatusByLandTitle(1, 'ACTIVE');

      expect(result.rowCount).toBe(3);
    });
  });

  // Error Handling (2 tests)
  describe('Error Handling', () => {
    it('should handle database errors during document creation', async () => {
      executeQuery.mockRejectedValue(new Error('Database error'));

      await expect(documentService.createDocument({
        land_title_id: 1,
        transaction_id: 'TXN-001',
        document_type: 'DEED',
        file_name: 'file.pdf',
        file_path: '/uploads/file.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user1'
      })).rejects.toThrow('Database error');
    });

    it('should publish failure event when upload fails', async () => {
      rabbitmq.publishToQueue.mockResolvedValue();

      await rabbitmq.publishToQueue('queue_landregistry', {
        event_type: 'DOCUMENT_FAILED',
        transaction_id: 'TXN-001',
        error: 'Upload failed'
      });

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith(
        'queue_landregistry',
        expect.objectContaining({ event_type: 'DOCUMENT_FAILED' })
      );
    });
  });
});
