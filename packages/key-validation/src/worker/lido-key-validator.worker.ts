import { validateLidoKeyForPossibleWC } from '../common/validate-one';
import { LidoKey, PossibleWC, Pubkey } from '../interfaces/common';
import { CHAINS } from '@lido-nestjs/constants/src';

export type Args = {
  lidoKeys: LidoKey[];
  chainId: CHAINS;
  possibleWC: PossibleWC;
};

export default (args: Args): [Pubkey, boolean][] => {
  return args.lidoKeys.map((key) => {
    return validateLidoKeyForPossibleWC(args.possibleWC, key, args.chainId);
  });
};
