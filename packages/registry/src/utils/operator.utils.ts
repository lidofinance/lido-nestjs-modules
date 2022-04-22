import { RegistryOperator } from '../storage/operator.entity';

export const compareOperators = (
  operatorOne: RegistryOperator | null,
  operatorTwo: RegistryOperator | null,
): boolean => {
  if (operatorOne == null) return false;
  if (operatorTwo == null) return false;

  const addressOne = operatorOne?.rewardAddress;
  const addressTwo = operatorTwo?.rewardAddress;

  if (addressOne !== addressTwo) return false;

  return true;
};
