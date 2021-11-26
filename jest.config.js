module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  testResultsProcessor: './node_modules/jest-junit-reporter',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/build', '/node_modules/'],
  coverageThreshold: {
    global: {
      statements: 94,
      branches: 85,
      functions: 100,
      lines: 94,
    },
  },
}
