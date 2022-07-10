export const getDepositMessage = (
  publicKey: Buffer,
  withdrawalCredentials: Buffer,
) => {
  const REQUIRED_DEPOSIT_ETH = 32;
  const ETH2GWEI = 10 ** 9;
  const amount = REQUIRED_DEPOSIT_ETH * ETH2GWEI;

  return {
    pubkey: publicKey,
    withdrawalCredentials: withdrawalCredentials,
    amount,
  };
};
