/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInterface, isInterfaceTag } from '../src/';

describe(`is-interface-tag function`, () => {
  test('should work', () => {
    interface Foo {
      bar: string;
    }

    const fooTag = createInterface<Foo>('Foo');

    class SomeClass implements Foo {
      bar = '';
    }

    const someSymbol = Symbol('someSymbol');

    expect(isInterfaceTag(fooTag)).toBe(true);
    expect(isInterfaceTag(SomeClass)).toBe(false);
    expect(isInterfaceTag(someSymbol)).toBe(false);
    expect(isInterfaceTag('baz')).toBe(false);
    expect(isInterfaceTag(1)).toBe(false);
    expect(isInterfaceTag(true)).toBe(false);
    expect(isInterfaceTag(false)).toBe(false);
    expect(isInterfaceTag({ id: Symbol('test') })).toBe(false);
  });
});
