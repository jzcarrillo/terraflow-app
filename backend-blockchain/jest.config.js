module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['services/chaincode-service.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/config/', '/services/fabric-client.js'],
  testTimeout: 10000
};
