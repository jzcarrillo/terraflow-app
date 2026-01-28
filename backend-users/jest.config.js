module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['services/users.js', 'utils/validation.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/config/'],
  testTimeout: 10000
};
