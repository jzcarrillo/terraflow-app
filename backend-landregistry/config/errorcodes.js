const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const MESSAGES = {
  LAND_TITLE_CREATED: 'Land title created successfully',
  LAND_TITLE_UPDATED: 'Land title updated successfully',
  LAND_TITLE_NOT_FOUND: 'Land title not found',
  TITLE_NUMBER_EXISTS: 'Title number already exists',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  DATABASE_ERROR: 'Database operation failed',
  UNAUTHORIZED_ACCESS: 'Access token required',
  INVALID_TOKEN: 'Invalid or expired token'
};

const DB_ERRORS = {
  UNIQUE_VIOLATION: '23505'
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  DB_ERRORS
};