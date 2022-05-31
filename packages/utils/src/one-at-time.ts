// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OneAtTime<T extends (...args: any[]) => Promise<any>>() {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const method = descriptor.value;
    let isExecuting = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args) {
      if (isExecuting) return;

      try {
        isExecuting = true;
        return await method?.apply(this, args);
      } catch (error) {
        this.logger.error(error);
      } finally {
        isExecuting = false;
      }
    } as T;
  };
}
