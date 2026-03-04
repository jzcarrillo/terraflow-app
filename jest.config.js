module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/'
  ],
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/api-gateway/**/*.test.js',
        '<rootDir>/backend-*/**/*.test.js'
      ],
      testPathIgnorePatterns: ['/node_modules/']
    },
    '<rootDir>/frontend'
  ],
  collectCoverageFrom: [
    'api-gateway/**/*.js',
    'backend-*/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**'
  ]
};
