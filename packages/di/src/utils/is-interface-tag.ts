/* eslint-disable @typescript-eslint/no-explicit-any */
import { InterfaceTag } from '../interfaces';
import { isClass } from './is-class';
import { INTERFACE_TAG } from '../di.constants';

export const isInterfaceTag = <T>(val: any): val is InterfaceTag<T> => {
  return (
    isClass(val) &&
    val.interfaceTag === INTERFACE_TAG &&
    typeof val.id === 'symbol'
  );
};
