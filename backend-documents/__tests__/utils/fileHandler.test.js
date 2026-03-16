jest.mock('fs');

const fs = require('fs');
const { streamFile, saveFile, deleteFile, getFileExtension } = require('../../utils/fileHandler');

describe('File Handler Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('streamFile', () => {
    it('should stream file with correct headers', () => {
      const mockPipe = jest.fn();
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue({ pipe: mockPipe });

      const res = {
        setHeader: jest.fn()
      };

      streamFile('/uploads/test.pdf', 'test.pdf', 'application/pdf', 1024, res, 'attachment');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="test.pdf"');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 1024);
      expect(fs.createReadStream).toHaveBeenCalledWith('/uploads/test.pdf');
      expect(mockPipe).toHaveBeenCalledWith(res);
    });

    it('should throw if file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const res = { setHeader: jest.fn() };

      expect(() => streamFile('/uploads/missing.pdf', 'missing.pdf', 'application/pdf', 0, res))
        .toThrow('File not found on disk');
    });
  });

  describe('saveFile', () => {
    it('should save file successfully', async () => {
      fs.promises = {
        writeFile: jest.fn().mockResolvedValue()
      };

      const buffer = Buffer.from('test content');
      const result = await saveFile(buffer, 'test.pdf');

      expect(result).toContain('test.pdf');
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should handle save file errors', async () => {
      fs.promises = {
        writeFile: jest.fn().mockRejectedValue(new Error('Write failed'))
      };

      await expect(saveFile(Buffer.from('test'), 'test.pdf')).rejects.toThrow('Write failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      fs.promises = {
        unlink: jest.fn().mockResolvedValue()
      };

      await deleteFile('/uploads/test.pdf');

      expect(fs.promises.unlink).toHaveBeenCalledWith('/uploads/test.pdf');
    });

    it('should handle delete file errors gracefully', async () => {
      fs.promises = {
        unlink: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };

      await expect(deleteFile('/uploads/test.pdf')).resolves.toBeUndefined();
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('file.name.with.dots.txt')).toBe('txt');
    });
  });
});
