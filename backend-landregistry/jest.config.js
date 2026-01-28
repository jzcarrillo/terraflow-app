module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/config/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'services/landtitles.js',
    'services/payments.js',
    'services/transfers.js',
    'utils/validation.js'
  ],
  testTimeout: 10000
};
