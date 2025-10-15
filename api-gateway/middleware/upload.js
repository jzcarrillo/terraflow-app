const multer = require('multer');
const { FILE_UPLOAD } = require('../config/constants');

// CONFIGURE MULTER FOR FILE UPLOADS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: FILE_UPLOAD.MAX_FILES
  },
  fileFilter: (req, file, cb) => {
    if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, JPG, PNG files are allowed.`));
    }
  }
});

// DIFFERENT UPLOAD CONFIGURATIONS FOR DIFFERENT USE CASES
const uploadSingle = upload.single('document');
const uploadMultiple = upload.array('documents', FILE_UPLOAD.MAX_FILES);
const uploadAttachments = upload.array('attachments', FILE_UPLOAD.MAX_FILES);

// ERROR HANDLING MIDDLEWARE
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadAttachments,
  handleUploadError
};