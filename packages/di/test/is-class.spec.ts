/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isClass } from '../src/';

describe(`is-class function`, () => {
  test('should work', () => {
    class Foo {}

    function Bar() {}
    Bar.prototype.hello = function () {
      return this;
    };

    function Baz() {}
    Object.setPrototypeOf(Baz, null);
    (<any>Baz)['prototype'] = null;

    expect(isClass(class {})).toBe(true);
    expect(isClass(Foo)).toBe(true);
    expect(isClass(Foo)).toBe(true);
    expect(isClass(Object)).toBe(true);
    expect(isClass(Bar)).toBe(false);
    expect(isClass(Baz)).toBe(false);
    expect(isClass(() => {})).toBe(false);
    expect(isClass(async () => {})).toBe(false);
    expect(isClass(function* () {})).toBe(false);
    expect(isClass(function f() {})).toBe(false);
    expect(isClass(1)).toBe(false);
    expect(isClass('')).toBe(false);
  });
});
