export const bufferFromHexString = (x: string) =>
  Buffer.from(x.replace(/^0x/, ''), 'hex');
