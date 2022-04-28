import { Test } from '@nestjs/testing';
import { getDefaultProvider } from '@ethersproject/providers';
import { RegistryFetchModule, RegistryMetaFetchService } from '../../src';

describe('Operators', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);
  let fetchService: RegistryMetaFetchService;

  beforeEach(async () => {
    const imports = [RegistryFetchModule.forFeature({ provider })];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    fetchService = moduleRef.get(RegistryMetaFetchService);
  });

  test('fetch keysOpIndex', async () => {
    const keysOpIndex = await fetchService.fetchKeysOpIndex();
    expect(typeof keysOpIndex).toBe('number');
    expect(keysOpIndex).toBeGreaterThan(0);
  });

  test('fetch Unbuffered logs', async () => {
    const logs = await fetchService.fetchUnbufferedLogsInRange(
      11_900_000,
      12_000_000,
    );

    expect(logs).toBeInstanceOf(Array);
    expect(logs.length).toBeGreaterThan(0);
  });

  test('fetch last Unbuffered log', async () => {
    const log = await fetchService.fetchLastUnbufferedLog({
      number: 14_000_000,
      hash: '0x9bff49171de27924fa958faf7b7ce605c1ff0fdee86f4c0c74239e6ae20d9446',
    });

    expect(log).toEqual(expect.objectContaining({ blockNumber: 13999866 }));
  });
});
