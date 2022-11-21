import { hasAttributes } from '../../src/ipfs/interfaces/utils';

test('has all listed attributes', () => {
  const param = { key: 'key1', sign: 'sign1' };

  expect(hasAttributes(param, ['key', 'sign'])).toBe(true);
});
test('doesnt have all listed attributes', () => {
  const param = { key: 'key1' };
  expect(hasAttributes(param, ['key', 'sign'])).toBe(false);
  expect(hasAttributes(param, ['key1', 'sign'])).toBe(false);

  expect(hasAttributes(undefined, ['key', 'sign'])).toBe(false);
  expect(hasAttributes(null, ['key', 'sign'])).toBe(false);
});
