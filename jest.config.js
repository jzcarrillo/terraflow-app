module.exports = {
  projects: [
    '<rootDir>/backend-landregistry',
    '<rootDir>/backend-users',
    '<rootDir>/backend-documents',
    '<rootDir>/backend-blockchain'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000
};
