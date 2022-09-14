import * as v8 from 'v8';

export const serialize = <T>(key: T): string => {
  return v8.serialize(key).toString('hex');
};

export const deserialize = <T>(data: string): T => {
  return v8.deserialize(Buffer.from(data, 'hex'));
};
