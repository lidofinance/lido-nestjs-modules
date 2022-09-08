/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { DESIGN_IMPLEMENTS, INTERFACE_TAG } from '../di.constants';
import { InterfaceTag } from '../interfaces';
import { isClass } from '../utils';

/**
 * Class decorator indicating that class implements interface at runtime
 *
 * This is needed for proper work of:
 * `foo instanceof IFoo`
 */
export const ImplementsAtRuntime = <T>(interfaceTag: InterfaceTag<T>) => {
  return (target: new (...args: any[]) => T): any => {
    const tags: symbol[] = [];

    if (!isClass(target)) {
      throw new Error(`'target' must be a class constructor`);
    }

    if (
      !(
        isClass(interfaceTag) &&
        interfaceTag.interfaceTag === INTERFACE_TAG &&
        interfaceTag.id
      )
    ) {
      throw new Error(
        `'interfaceTag' must be a special anonymous class constructor`,
      );
    }

    tags.push(interfaceTag.id);

    if (Reflect.hasMetadata(DESIGN_IMPLEMENTS, target)) {
      const existingTags = Reflect.getMetadata(DESIGN_IMPLEMENTS, target);
      tags.push(...existingTags);
    }

    Reflect.defineMetadata(DESIGN_IMPLEMENTS, tags, target);
  };
};
