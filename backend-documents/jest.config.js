module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['services/document.js', 'utils/database.js', 'utils/fileHandler.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/config/'],
  testTimeout: 10000
};
