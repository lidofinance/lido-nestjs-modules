const genRandomHex = (length: number) =>
  [...Array(length)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

export const createStateValidators = (n: number) => {
  const data = [...Array(n)].map((v, i) => ({
    index: i.toString(),
    balance: '34006594880',
    status: 'active_ongoing',
    validator: {
      pubkey: `0x${genRandomHex(96)}`,
      withdrawal_credentials: `0x00${genRandomHex(62)}`,
      effective_balance: '32000000000',
      slashed: false,
      activation_eligibility_epoch: '0',
      activation_epoch: '0',
      exit_epoch: '18446744073709551615',
      withdrawable_epoch: '18446744073709551615',
    },
  }));

  return {
    execution_optimistic: false,
    data: data,
  };
};
