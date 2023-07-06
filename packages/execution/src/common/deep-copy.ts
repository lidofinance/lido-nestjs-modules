// Returns a new copy of object, such that no properties may be replaced.
// New properties may be added only to objects.
import { defineReadOnly } from '../provider/extended-json-rpc-batch-provider';
import { isFrozen } from './is-frozen';
import { Logger, version } from 'ethers';

const logger = new Logger(version);

function _deepCopy(object: any): any {
  if (isFrozen(object)) {
    return object;
  }

  // Arrays are mutable, so we need to create a copy
  if (Array.isArray(object)) {
    return Object.freeze(object.map((item) => deepCopy(item)));
  }

  if (typeof object === 'object') {
    const result: { [key: string]: any } = {};
    for (const key in object) {
      const value = object[key];
      if (value === undefined) {
        continue;
      }
      defineReadOnly(result, key, deepCopy(value));
    }

    return result;
  }

  return logger.throwArgumentError(
    `Cannot deepCopy ${typeof object}`,
    'object',
    object,
  );
}

export function deepCopy<T>(object: T): T {
  return _deepCopy(object);
}
