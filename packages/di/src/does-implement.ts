/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { DESIGN_IMPLEMENTS, INTERFACE_TAG } from './constants';
import { InterfaceTag } from './interface.tag';
import { isClass } from './is-class';

/**
 * Checks that target implements specific interface tag
 */
export function doesImplement<T>(
  target: T | any,
  interfaceTag: InterfaceTag<any>,
): target is T {
  if (typeof target === 'undefined' || target === null) {
    return false;
  }

  if (Reflect.hasMetadata(DESIGN_IMPLEMENTS, target.constructor)) {
    const tags: symbol[] = Reflect.getMetadata(
      DESIGN_IMPLEMENTS,
      target.constructor,
    );
    let tag: symbol;

    if (isClass(interfaceTag) && interfaceTag.interfaceTag === INTERFACE_TAG) {
      tag = interfaceTag.id;
    } else {
      return false;
    }

    return tags.indexOf(tag) >= 0;
  }

  return false;
}