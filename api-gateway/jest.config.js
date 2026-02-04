module.exports = {
  displayName: 'api-gateway',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'middleware/**/*.js',
    'utils/**/*.js',
    'schemas/**/*.js',
    '!**/node_modules/**'
  ]
};
