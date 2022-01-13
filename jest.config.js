module.exports = {
  cacheDirectory: '.jest/cache',
  coverageDirectory: '.jest/coverage',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  collectCoverageFrom: ['packages/**/src/**/*.ts'],
  transform: {
    '^.+\\.[t|j]s?$': 'babel-jest',
  },
  testEnvironment: 'jest-environment-jsdom',
};
