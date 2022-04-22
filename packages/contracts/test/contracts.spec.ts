import { JsonRpcProvider } from '@ethersproject/providers';
import { CHAINS } from '@lido-nestjs/constants';
import { Test } from '@nestjs/testing';
import {
  AragonTokenManagerContractModule,
  AragonVotingManagerContractModule,
  DepositContractModule,
  EasyTrackContractModule,
  LdoContractModule,
  LidoContractModule,
  MevVaultContractModule,
  OracleContractModule,
  RegistryContractModule,
  SecurityContractModule,
  WstethContractModule,
  ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES,
  ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN,
  ARAGON_VOTING_CONTRACT_ADDRESSES,
  ARAGON_VOTING_CONTRACT_TOKEN,
  DEPOSIT_CONTRACT_ADDRESSES,
  DEPOSIT_CONTRACT_TOKEN,
  EASYTRACK_CONTRACT_ADDRESSES,
  EASYTRACK_CONTRACT_TOKEN,
  LDO_CONTRACT_ADDRESSES,
  LDO_CONTRACT_TOKEN,
  LIDO_CONTRACT_ADDRESSES,
  LIDO_CONTRACT_TOKEN,
  MEV_VAULT_CONTRACT_ADDRESSES,
  MEV_VAULT_CONTRACT_TOKEN,
  ORACLE_CONTRACT_ADDRESSES,
  ORACLE_CONTRACT_TOKEN,
  REGISTRY_CONTRACT_ADDRESSES,
  REGISTRY_CONTRACT_TOKEN,
  SECURITY_CONTRACT_ADDRESSES,
  SECURITY_CONTRACT_TOKEN,
  WSTETH_CONTRACT_ADDRESSES,
  WSTETH_CONTRACT_TOKEN,
} from '../src';
import { ContractModule } from '../src/contract.module';

describe('Chains', () => {
  const getContract = async (
    Module: typeof ContractModule,
    token: symbol,
    chainId: string | CHAINS,
  ) => {
    const provider = new JsonRpcProvider('http://localhost');

    jest.spyOn(provider, 'detectNetwork').mockImplementation(async () => {
      return { chainId: Number(chainId), name: 'empty' };
    });

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

  test('aragon token manager', async () => {
    await testAddress(
      AragonTokenManagerContractModule,
      ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN,
      ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES,
    );
  });

  test('aragon voting', async () => {
    await testAddress(
      AragonVotingManagerContractModule,
      ARAGON_VOTING_CONTRACT_TOKEN,
      ARAGON_VOTING_CONTRACT_ADDRESSES,
    );
  });

  test('deposit', async () => {
    await testAddress(
      DepositContractModule,
      DEPOSIT_CONTRACT_TOKEN,
      DEPOSIT_CONTRACT_ADDRESSES,
    );
  });

  test('easytrack', async () => {
    await testAddress(
      EasyTrackContractModule,
      EASYTRACK_CONTRACT_TOKEN,
      EASYTRACK_CONTRACT_ADDRESSES,
    );
  });

  test('ldo', async () => {
    await testAddress(
      LdoContractModule,
      LDO_CONTRACT_TOKEN,
      LDO_CONTRACT_ADDRESSES,
    );
  });

  test('lido', async () => {
    await testAddress(
      LidoContractModule,
      LIDO_CONTRACT_TOKEN,
      LIDO_CONTRACT_ADDRESSES,
    );
  });

  test('mev vault', async () => {
    await testAddress(
      MevVaultContractModule,
      MEV_VAULT_CONTRACT_TOKEN,
      MEV_VAULT_CONTRACT_ADDRESSES,
    );
  });

  test('oracle', async () => {
    await testAddress(
      OracleContractModule,
      ORACLE_CONTRACT_TOKEN,
      ORACLE_CONTRACT_ADDRESSES,
    );
  });

  test('registry', async () => {
    await testAddress(
      RegistryContractModule,
      REGISTRY_CONTRACT_TOKEN,
      REGISTRY_CONTRACT_ADDRESSES,
    );
  });

  test('security', async () => {
    await testAddress(
      SecurityContractModule,
      SECURITY_CONTRACT_TOKEN,
      SECURITY_CONTRACT_ADDRESSES,
    );
  });

  test('wsteth', async () => {
    await testAddress(
      WstethContractModule,
      WSTETH_CONTRACT_TOKEN,
      WSTETH_CONTRACT_ADDRESSES,
    );
  });
});
