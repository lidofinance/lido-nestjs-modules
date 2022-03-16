import { Test } from '@nestjs/testing';
import {
  RegistryContractModule,
  LidoContractModule,
} from '@lido-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';
import { RegistryFetchModule, RegistryMetaFetchService } from '../../src';

describe('Operators', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);
  let fetchService: RegistryMetaFetchService;

  beforeEach(async () => {
    const imports = [
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forFeature(),
    ];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    fetchService = moduleRef.get(RegistryMetaFetchService);
  });

  test('fetch keysOpIndex', async () => {
    const keysOpIndex = await fetchService.fetchKeysOpIndex();
    expect(typeof keysOpIndex).toBe('number');
    expect(keysOpIndex).toBeGreaterThan(0);
  });

  test('fetch Unbuffered logs', async () => {
    const logs = await fetchService.fetchUnbufferedLogs(11_900_000, 12_000_000);

    expect(logs).toBeInstanceOf(Array);
    expect(logs.length).toBeGreaterThan(0);
  });

  test('fetch last Unbuffered log', async () => {
    const log = await fetchService.fetchLastUnbufferedLog(14_000_000);

    expect(log).toEqual(expect.objectContaining({ blockNumber: 13999866 }));
  });
});
