export function isFrozen(object: any): boolean {
  // Opaque objects are not mutable, so safe to copy by assignment
  if (object === undefined || object === null || opaque[typeof object]) {
    return true;
  }

  if (Array.isArray(object) || typeof object === 'object') {
    if (!Object.isFrozen(object)) {
      return false;
    }

    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++) {
      let value: any = null;
      try {
        value = object[keys[i]];
      } catch (error) {
        // If accessing a value triggers an error, it is a getter
        // designed to do so (e.g. Result) and is therefore "frozen"
        continue;
      }

      if (!_isFrozen(value)) {
        return false;
      }
    }

    return true;
  }

  return logger.throwArgumentError(
    `Cannot deepCopy ${typeof object}`,
    'object',
    object,
  );
}
