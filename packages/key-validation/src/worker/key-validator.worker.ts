import { validateKey } from '../common/validate-one';
import { KeyWithWC, Pubkey } from '../interfaces/common';
import { bufferFromHexString } from '../common/buffer-hex';

export type Args = {
  keys: KeyWithWC[];
  genesisForkVersion: Buffer;
};

export default (args: Args): [Pubkey, boolean][] => {
  return args.keys.map((key) => {
    return [
      key.key,
      validateKey(key, bufferFromHexString(key.wc), args.genesisForkVersion),
    ];
  });
};
