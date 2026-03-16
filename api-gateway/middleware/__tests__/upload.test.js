const { uploadSingle, uploadMultiple, uploadAttachments, handleUploadError } = require('../upload');
const multer = require('multer');

describe('Upload Middleware', () => {
  describe('handleUploadError', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();
    });

    it('should handle file size limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      
      handleUploadError(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'File too large' }));
    });

    it('should handle file count limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      
      handleUploadError(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Too many files' }));
    });

    it('should handle invalid file type error', () => {
      const error = new Error('Invalid file type: text/plain. Only PDF, JPG, PNG files are allowed.');
      
      handleUploadError(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid file type' }));
    });

    it('should pass other errors to next', () => {
      const error = new Error('Other error');
      
      handleUploadError(error, req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  it('should export upload configurations', () => {
    expect(uploadSingle).toBeDefined();
    expect(uploadMultiple).toBeDefined();
    expect(uploadAttachments).toBeDefined();
  });
});
