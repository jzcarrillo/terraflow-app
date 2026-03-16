const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: __dirname,
})

const customJestConfig = {
  displayName: 'frontend',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['next/dist/build/swc/jest-transformer', {}],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(next)/)',
  ],
  rootDir: __dirname,
}

module.exports = createJestConfig(customJestConfig)
