const handleError = (error, res, operation) => {
  console.error(`❌ ${operation} failed:`, error.message);
  console.error(`❌ Error stack:`, error.stack);
  
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
  
  if (error.message.includes('already exists')) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: error.message
    });
  }
  
  if (error.message.includes('not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: error.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
};

module.exports = { handleError };