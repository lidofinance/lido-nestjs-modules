import { hasAttributes } from './utils';

export type KeySignPair = {
  key: string;
  sign: string;
};

export function isKeySignPairArray(value: unknown): value is KeySignPair[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((v) => isKeySignPair(v));
}

export const isKeySignPair = (value: unknown): value is KeySignPair => {
  return (
    hasAttributes(value, ['key', 'sign']) &&
    typeof value.key === 'string' &&
    typeof value.sign === 'string'
  );
};
