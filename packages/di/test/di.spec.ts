/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createInterface, ImplementsAtRuntime } from '../src';

describe(`ImplementsAtRuntime decorator`, () => {
  test('should work', () => {
    const IFoo = createInterface<IFoo>('IFoo');
    const IBar = createInterface<IBar>('IBar');

    interface IFoo {
      helloFoo(): string;
    }

    interface IBar {
      helloBar(): string;
    }

    @ImplementsAtRuntime(IFoo)
    class Foo implements IFoo {
      helloFoo(): string {
        return 'helloFoo';
      }
    }

    // TS warnings will also work without implements keyword
    @ImplementsAtRuntime(IBar)
    class Bar {
      helloBar(): string {
        return 'helloBar';
      }
    }

    const foo = new Foo();
    const bar = new Bar();
    const baz = {};

    // magic!
    expect(bar).toBeInstanceOf(IBar);
    expect(foo).toBeInstanceOf(IFoo);
    expect(foo).not.toBeInstanceOf(IBar);

    if (bar instanceof IFoo) {
      // TS type checking should also work
      bar.helloFoo();
      throw new Error('bar is not instance of IFoo');
    }

    if (baz instanceof IFoo) {
      // TS type checking should also work
      baz.helloFoo();
      throw new Error('baz is not instance of IFoo');
    }
  });

  test('should work for multiple different classes', () => {
    const IFoo = createInterface<IFoo>('IFoo');

    interface IFoo {
      helloFoo(): string;
    }

    @ImplementsAtRuntime(IFoo)
    class FooA implements IFoo {
      helloFoo(): string {
        return 'helloFooA';
      }
    }

    @ImplementsAtRuntime(IFoo)
    class FooB implements IFoo {
      helloFoo(): string {
        return 'helloFooB';
      }
    }

    const fooA = new FooA();
    const fooB = new FooB();

    expect(fooA).toBeInstanceOf(IFoo);
    expect(fooB).toBeInstanceOf(IFoo);
  });

  test('should work for one class and different interfaces', () => {
    const IFoo = createInterface<IFoo>('IFoo');
    const IBar = createInterface<IBar>('IBar');

    interface IFoo {
      helloFoo(): string;
    }

    interface IBar {
      helloBar(): string;
    }

    @ImplementsAtRuntime(IFoo)
    @ImplementsAtRuntime(IBar)
    class Foo implements IFoo, IBar {
      helloFoo(): string {
        return 'helloFoo';
      }
      helloBar(): string {
        return 'helloBar';
      }
    }

    const foo = new Foo();

    expect(foo).toBeInstanceOf(IFoo);
    expect(foo).toBeInstanceOf(IBar);
  });

  test('should throw exception when applied to an object', () => {
    const IFoo = createInterface<IFoo>('IFoo');

    interface IFoo {
      helloFoo(): string;
    }

    class Foo implements IFoo {
      helloFoo(): string {
        return 'helloFoo';
      }
    }

    const obj: any = {};

    expect(() => {
      ImplementsAtRuntime(IFoo)(obj);
    }).toThrow(`'target' must be a class constructor`);
  });

  test('should throw exception when interface is not an InterfaceTag', () => {
    class Foo {
      helloFoo(): string {
        return 'helloFoo';
      }
    }

    expect(() => {
      ImplementsAtRuntime(<any>{})(Foo);
    }).toThrow(`'interfaceTag' must be a special anonymous class constructor`);

    expect(() => {
      ImplementsAtRuntime(<any>class {})(Foo);
    }).toThrow(`'interfaceTag' must be a special anonymous class constructor`);
  });
});
