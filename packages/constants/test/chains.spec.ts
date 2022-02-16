import { CHAINS } from '../src';

describe('Chains', () => {
  test('Chains defined', () => {
    expect(CHAINS.Mainnet).toBeDefined();
    expect(CHAINS.Ropsten).toBeDefined();
    expect(CHAINS.Rinkeby).toBeDefined();
    expect(CHAINS.Goerli).toBeDefined();
    expect(CHAINS.Kovan).toBeDefined();
    expect(CHAINS.Kintsugi).toBeDefined();
  });
});
