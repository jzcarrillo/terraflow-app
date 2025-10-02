class ErrorHandler {
  
// HANDLE VALIDATION ERRORS (ZOD)
  static handleValidationError(error, res) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      });
    }
    return false;
  }

// HANDLE SERVICE ERRORS
  static handleServiceError(error, res, defaultMessage = 'Internal server error') {
    console.error('❌ Service error:', error.message);
    
    if (error.message.includes('RabbitMQ')) {
      return res.status(500).json({ error: 'Message queue unavailable' });
    }
    
    if (error.message.includes('Backend') || error.message.includes('service unavailable')) {
      return res.status(503).json({ error: 'Backend service unavailable' });
    }
    
    return res.status(500).json({ error: defaultMessage });
  }

// GENERIC ERROR HANDLER
  static handleError(error, res, context = '') {
    console.error(`❌ ${context} error:`, error.message);
    
// TRY VALIDATION ERROR FIRST
    if (this.handleValidationError(error, res)) {
      return;
    }
    
    // SERVICE ERRORS
    this.handleServiceError(error, res);
  }
}

module.exports = ErrorHandler;