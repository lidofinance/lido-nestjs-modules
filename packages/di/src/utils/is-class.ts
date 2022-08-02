export const isClass = (val: unknown): boolean => {
  return typeof val === 'function'
    ? val.prototype
      ? /* istanbul ignore next */ Object.getOwnPropertyDescriptor(
          val,
          'prototype',
        )?.writable
        ? false
        : true
      : false
    : false;
};
