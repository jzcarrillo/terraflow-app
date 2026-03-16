module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/config/'],
  testTimeout: 10000
};
