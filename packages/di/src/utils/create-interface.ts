/* eslint-disable @typescript-eslint/no-explicit-any */
import { doesImplement } from './does-implement';
import { InterfaceTag } from '../interfaces';
import { INTERFACE_MAP_KEY, INTERFACE_TAG } from '../di.constants';

/**
 * Creates special interface-like anonymous class that acts like an interface
 * utilizing `Symbol.hasInstance` method that allows to override behavior of `instanceof` operator
 *
 * Example:
 *
 * export interface FooInterface {
 *    bar(): string;
 * }
 * export const FooInterface = createInterface<FooInterface>('FooInterface');
 *
 * @ImplementsAtRuntime(FooInterface)
 * export class Foo implements FooInterface {
 *    bar(): string {
 *      return 'bar';
 *    }
 * }
 *
 * const foo = new Foo();
 *
 * foo instanceof FooInterface === true;
 *
 */
export const createInterface = <I>(name: string): InterfaceTag<I> => {
  const id = Symbol.for(name);

  const _global = global as globalThis.Global &
    Record<symbol, Map<symbol, InterfaceTag<any>>>;

  if (!_global[INTERFACE_MAP_KEY]) {
    _global[INTERFACE_MAP_KEY] = new Map<symbol, InterfaceTag<any>>();
  }

  const interfaceMap: Map<symbol, InterfaceTag<any>> = _global[
    INTERFACE_MAP_KEY
  ];

  const foundInterfaceTag = interfaceMap.get(id);

  if (foundInterfaceTag) {
    return <InterfaceTag<I>>foundInterfaceTag;
  }

  const newInterfaceTag = class {
    private static readonly tag: symbol = id;
    public static readonly interfaceTag: symbol = INTERFACE_TAG;

    public static [Symbol.hasInstance](instance: unknown) {
      return doesImplement(instance, this);
    }

    public static get id(): symbol {
      return this.tag;
    }
  };

  Object.defineProperty(newInterfaceTag, 'name', {
    value: name,
    writable: false,
  });
  Object.freeze(newInterfaceTag);

  interfaceMap.set(id, newInterfaceTag);

  return <InterfaceTag<I>>(<any>newInterfaceTag);
};
