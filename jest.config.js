module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  testResultsProcessor: './node_modules/jest-junit-reporter',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/build', '/node_modules/'],
  coverageThreshold: {
    global: {
      statements: 91,
      branches: 84,
      functions: 100,
      lines: 91,
    },
  },
}
