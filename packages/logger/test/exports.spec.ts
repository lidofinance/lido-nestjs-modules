import { LOGGER_OPTIONS, LOGGER_PROVIDER } from '../src';

describe('Exports', () => {
  test('Logger tokens', () => {
    expect(LOGGER_OPTIONS).toBeDefined();
    expect(LOGGER_PROVIDER).toBeDefined();
  });
});
