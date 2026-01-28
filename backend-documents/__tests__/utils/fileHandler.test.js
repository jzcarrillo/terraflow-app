jest.mock('fs');

const fs = require('fs');
const { saveFile, deleteFile, getFileExtension } = require('../../utils/fileHandler');

describe('File Handler Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
