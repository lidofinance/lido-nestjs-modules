/* eslint-disable @typescript-eslint/no-explicit-any */
import * as v8 from 'v8';
import * as crypto from 'crypto';

type Func<A, R> = (...args: A[]) => R | Promise<R>;

interface TypedMethodDescriptor<T> {
  value: T;
}

interface TypedGetterDescriptor<T> {
  get: Func<never, T>;
}

function getNewWrapper<A, R>(
  originalFn: Func<A, R>,
  target: object,
): Func<A, R> {
  let ongoingPromises: Map<string, Promise<R> | undefined>;

  const wrapper: Func<A, R> = function (this: typeof target, ...args: A[]) {
    const serialized = v8.serialize(args).toString('hex');
    const hasher = crypto.createHash('sha256');
    hasher.update(serialized);
    const hash = hasher.digest('hex');
    const cachedResult = ongoingPromises && ongoingPromises.get(hash);

    if (cachedResult) {
      return cachedResult;
    }

    const result = originalFn.call(this, ...args);

    if (!(result instanceof Promise)) {
      return result;
    }

    ongoingPromises = ongoingPromises ? ongoingPromises : new Map();

    result.finally(() => {
      ongoingPromises.delete(hash);
    });

    ongoingPromises.set(hash, result);

    return result;
  };

  return wrapper;
}

const isTypedMethodDescriptor = <T>(
  descriptor: any,
): descriptor is TypedMethodDescriptor<T> => {
  return (
    descriptor &&
    Object.hasOwnProperty.call(descriptor, 'value') &&
    typeof descriptor.value === 'function'
  );
};

const isTypedGetterDescriptor = <T>(
  descriptor: any,
): descriptor is TypedGetterDescriptor<T> => {
  return (
    descriptor &&
    Object.hasOwnProperty.call(descriptor, 'get') &&
    typeof descriptor.get === 'function'
  );
};

/**
 * Method and Getter Decorator to memoize promise, returned from a first call in a bunch of parallel multiple calls,
 * Promise is memoized until first returned promise is finalized.
 *
 *
 * Example:
 *
 * const A = [1,2,3];
 * const B = [1,2,3,4];
 *
 * class Foo {
 *  @DebouncePromise()
 *  async function doSomethingAsync<A>(args: A): Promise<A> {
 *      await sleep(1000);
 *      return args;
 *  }
 * }
 *
 * const foo = new Foo();
 *
 * await Promise.all([
 *    foo.doSomethingAsync(A), // will be called, will return Promise<A>
 *    foo.doSomethingAsync(A), // decorated function will not be called, but decorator will return the same Promise<A> from previous function call
 *    foo.doSomethingAsync(B), // this also will be called (arguments are different), will return Promise<B>
 *    foo.doSomethingAsync(B)  // decorated function will not be called, but decorator will return the same Promise<B> from previous function call
 * ]);
 *
 */
export const MemoizeInFlightPromise = <A, R>() => {
  function decorator(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedMethodDescriptor<Func<A, R>> | TypedGetterDescriptor<R>,
  ): void {
    if (isTypedMethodDescriptor(descriptor)) {
      descriptor.value = getNewWrapper(descriptor.value, target);
    } else if (isTypedGetterDescriptor(descriptor)) {
      descriptor.get = getNewWrapper(descriptor.get, target);
    } else {
      throw new Error(
        'MemoizeInFlightPromise() decorator can be applied to a method or get accessor only',
      );
    }
  }

  return <MethodDecorator>decorator;
};
