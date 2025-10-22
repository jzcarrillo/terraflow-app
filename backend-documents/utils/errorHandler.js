const handleError = (error, res, operation) => {
  console.error(`❌ ${operation} failed:`, error.message);
  
  if (error.message.includes('not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: error.message
    });
  }
  
  if (error.message.includes('File not found')) {
    return res.status(404).json({
      error: 'File not found',
      message: error.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Operation failed'
  });
};

module.exports = { handleError };