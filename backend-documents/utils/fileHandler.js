const fs = require('fs');
const path = require('path');

const streamFile = (filePath, fileName, mimeType, fileSize, res, disposition = 'attachment') => {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on disk');
  }
  
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
  res.setHeader('Content-Length', fileSize);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
};

const saveFile = async (buffer, fileName) => {
  const filePath = path.join('./uploads', fileName);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error.message);
  }
};

const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

module.exports = {
  streamFile,
  saveFile,
  deleteFile,
  getFileExtension
};