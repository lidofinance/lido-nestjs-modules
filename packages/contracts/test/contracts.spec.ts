import { getDefaultProvider } from '@ethersproject/providers';
import { getNetwork } from '@ethersproject/networks';
import { CHAINS } from '@lido-nestjs/constants';
import { Test } from '@nestjs/testing';
import {
  LidoContractModule,
  LIDO_CONTRACT_ADDRESSES,
  LIDO_CONTRACT_TOKEN,
} from '../src';
import { ContractModule } from '../src/contract.module';

describe('Chains', () => {
  const getContract = async (
    Module: typeof ContractModule,
    token: symbol,
    chainId: string | CHAINS,
  ) => {
    const provider = getDefaultProvider(getNetwork(Number(chainId)));
    const moduleRef = await Test.createTestingModule({
      imports: [Module.forRoot({ provider })],
    }).compile();

    return moduleRef.get(token);
  };

  const testAddress = async (
    Module: typeof ContractModule,
    token: symbol,
    addressMap: Record<number, string>,
  ) => {
    await Promise.all(
      Object.entries(addressMap).map(async ([chainId, address]) => {
        const contract = await getContract(Module, token, chainId);
        expect(contract.address).toBe(address);
      }),
    );
  };

  test('unexpected chain', async () => {
    await expect(() =>
      getContract(LidoContractModule, LIDO_CONTRACT_TOKEN, CHAINS.Kovan),
    ).rejects.toThrow();
  });

  test('lido', async () => {
    await testAddress(
      LidoContractModule,
      LIDO_CONTRACT_TOKEN,
      LIDO_CONTRACT_ADDRESSES,
    );
  });
});
