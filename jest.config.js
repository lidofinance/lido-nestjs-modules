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
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['packages/**/src/**/*.ts'],
  coveragePathIgnorePatterns: ['generated', 'migrations'],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ]
  },
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
};
