/* eslint-disable @typescript-eslint/no-explicit-any */
import { isKeySignPairArray } from '../../src';

describe('check KeySignPair[]', () => {
  test('isnt array', () => {
    const param: unknown = { key: 'key1', sign: 'sign1' };

    expect(isKeySignPairArray(param)).toBe(false);
  });
  test('absence of sign', () => {
    const param: any = [{ key: 'key1', sign: 'sign1' }, { key: 'key1' }];
    expect(isKeySignPairArray(param)).toBe(false);
  });
  test('wrong type', () => {
    const param: unknown = [
      { key: 'key1', sign: 'sign1' },
      { key: 'key1', sign: 5 },
    ];
    expect(isKeySignPairArray(param)).toBe(false);
  });
  test('successful', () => {
    const param: unknown = [
      { key: 'key1', sign: 'sign1' },
      { key: 'key1', sign: 'sign1' },
    ];
    expect(isKeySignPairArray(param)).toBe(true);
  });
});
