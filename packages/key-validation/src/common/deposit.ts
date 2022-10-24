export const getDepositMessage = (
  publicKey: Buffer,
  withdrawalCredentials: Buffer,
  amount: number,
) => {
  return {
    pubkey: publicKey,
    withdrawalCredentials: withdrawalCredentials,
    amount,
  };
};
