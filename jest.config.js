module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'lib/**/*.js',
    'controllers/**/*.js',
    '!**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
