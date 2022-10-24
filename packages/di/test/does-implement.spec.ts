/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInterface, doesImplement, ImplementsAtRuntime } from '../src';

describe(`doesImplement`, () => {
  test('should return true', () => {
    const IFoo = createInterface<IFoo>('IFoo');
    interface IFoo {}

    @ImplementsAtRuntime(IFoo)
    class Foo implements IFoo {}

    const foo = new Foo();
    expect(doesImplement(foo, IFoo)).toBe(true);
  });

  test('should return false', () => {
    const IFoo = createInterface<IFoo>('IFoo');
    const IBar = createInterface<IBar>('IBar');
    interface IFoo {}
    interface IBar {}

    @ImplementsAtRuntime(IFoo)
    class Foo implements IFoo {}

    class Bar {}

    const foo = new Foo();
    const bar = new Bar();
    expect(doesImplement(foo, IFoo)).toBe(true);
    expect(doesImplement(foo, IBar)).toBe(false);
    expect(doesImplement(bar, IFoo)).toBe(false);
    expect(doesImplement({}, IFoo)).toBe(false);
    expect(doesImplement(undefined, IFoo)).toBe(false);
    expect(doesImplement(null, IFoo)).toBe(false);
    expect(doesImplement(false, IFoo)).toBe(false);
    expect(doesImplement(foo, <any>undefined)).toBe(false);
    expect(doesImplement(foo, <any>null)).toBe(false);
    expect(doesImplement(foo, <any>false)).toBe(false);
    expect(doesImplement(foo, <any>Boolean)).toBe(false);
    expect(doesImplement(foo, <any>{ constructor: true })).toBe(false);
    expect(doesImplement(foo, <any>class {})).toBe(false);
    expect(doesImplement(foo, <any>function f() {})).toBe(false);
    expect(doesImplement(foo, <any>async function f() {})).toBe(false);
    expect(doesImplement(foo, <any>(() => {}))).toBe(false);
    expect(doesImplement(foo, <any>(async () => {}))).toBe(false);
  });
});
