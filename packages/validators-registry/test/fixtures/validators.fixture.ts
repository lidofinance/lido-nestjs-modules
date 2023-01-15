import { Validator, ValidatorStatus } from '../../src';

export const validatorA: Validator = {
  index: 232232,
  pubkey:
    '0x831cc5efdda960ec310782bbfd92fe94d23eab19a495f846a5c2a1cfa039085cc69791ee95506fefad759e946bed4637',
  status: ValidatorStatus.ACTIVE_ONGOING,
};

export const validatorB: Validator = {
  index: 232233,
  pubkey:
    '0x999cbb97f00c2979b1356d7c82f9999518309fe741d4cfa6a7f247990f3f25c22f7f2f53bf5a0ab5e75872c01a4c54d2',
  status: ValidatorStatus.ACTIVE_ONGOING,
};

export const validatorC: Validator = {
  index: 353346,
  pubkey:
    '0x946df13c5da9de1e552a31b3f1faeb2cec49887c1909d23da1b697d304695f543d4646c3c5119e886ae423a34d97d07d',
  status: ValidatorStatus.PENDING_INITIALIZED,
};

export const validatorD: Validator = {
  index: 353347,
  pubkey:
    '0x96540fc2aa9ea8fc5eb24621f9c1d098a4e6b83bfdb7c69beab3663b628f1b86602e51518be63c4875aa3c0c5e7cff22',
  status: ValidatorStatus.PENDING_QUEUED,
};

export const validators = [validatorA, validatorB];
export const validators2 = [validatorC, validatorD];
