const documentController = require('../../controllers/documents');
const documentService = require('../../services/document');
const { streamFile } = require('../../utils/fileHandler');

jest.mock('../../services/document');
jest.mock('../../utils/fileHandler');

describe('Document Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getDocumentsByLandTitle', () => {
    it('should return documents by land title', async () => {
      req.params.landTitleId = '1';
      const mockDocs = [
        { id: 1, document_type: 'deed', file_name: 'deed.pdf', file_size: 1024, mime_type: 'application/pdf', created_at: new Date() }
      ];
      documentService.getDocumentsByLandTitleId.mockResolvedValue(mockDocs);

      await documentController.getDocumentsByLandTitle(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 1, document_type: 'deed', original_name: 'deed.pdf', size: 1024, mime_type: 'application/pdf', created_at: expect.any(Date) }
      ]);
    });

    it('should handle errors', async () => {
      req.params.landTitleId = '1';
      documentService.getDocumentsByLandTitleId.mockRejectedValue(new Error('DB error'));

      await documentController.getDocumentsByLandTitle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('downloadDocument', () => {
    it('should download document', async () => {
      req.params.documentId = '1';
      const mockDoc = { id: 1, file_path: '/path/to/file.pdf', file_name: 'file.pdf', mime_type: 'application/pdf', file_size: 1024 };
      documentService.getDocumentById.mockResolvedValue(mockDoc);

      await documentController.downloadDocument(req, res);

      expect(streamFile).toHaveBeenCalledWith('/path/to/file.pdf', 'file.pdf', 'application/pdf', 1024, res, 'attachment');
    });

    it('should return 404 if document not found', async () => {
      req.params.documentId = '999';
      documentService.getDocumentById.mockResolvedValue(null);

      await documentController.downloadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.documentId = '1';
      documentService.getDocumentById.mockRejectedValue(new Error('DB error'));

      await documentController.downloadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('viewDocument', () => {
    it('should view document inline', async () => {
      req.params.documentId = '1';
      const mockDoc = { id: 1, file_path: '/path/to/file.pdf', file_name: 'file.pdf', mime_type: 'application/pdf', file_size: 1024 };
      documentService.getDocumentById.mockResolvedValue(mockDoc);

      await documentController.viewDocument(req, res);

      expect(streamFile).toHaveBeenCalledWith('/path/to/file.pdf', 'file.pdf', 'application/pdf', 1024, res, 'inline');
    });

    it('should return 404 if document not found', async () => {
      req.params.documentId = '999';
      documentService.getDocumentById.mockResolvedValue(null);

      await documentController.viewDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.documentId = '1';
      documentService.getDocumentById.mockRejectedValue(new Error('DB error'));

      await documentController.viewDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
