import { Test } from '@nestjs/testing';
import { JsonRpcBatchProvider } from '@ethersproject/providers';
import { RegistryFetchModule, RegistryKeyFetchService } from '../../src';

describe('Keys', () => {
  const provider = new JsonRpcBatchProvider(process.env.EL_RPC_URL);
  let fetchService: RegistryKeyFetchService;

  beforeEach(async () => {
    const imports = [RegistryFetchModule.forFeature({ provider })];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    fetchService = moduleRef.get(RegistryKeyFetchService);
  });

  test('fetch one key', async () => {
    const key = await fetchService.fetchOne(6, 0, { blockTag: 120092 });

    expect(key).toBeInstanceOf(Object);

    expect(typeof key.operatorIndex).toBe('number');
    expect(typeof key.index).toBe('number');
    expect(typeof key.key).toBe('string');
    expect(typeof key.depositSignature).toBe('string');
  });

  test('fetch operator keys', async () => {
    const keys = await fetchService.fetch(6, 0, -1, { blockTag: 120092 });

    expect(keys).toBeInstanceOf(Array);
    expect(keys.length).toBe(500);
  }, 15_000);

  test('fetch multiply operators', async () => {
    const keys = await fetchService.fetch(6, 0, 2, { blockTag: 120092 });

    expect(keys).toBeInstanceOf(Array);
    expect(keys.length).toBe(2);

    expect(keys[0].operatorIndex).toBe(6);
    expect(keys[1].operatorIndex).toBe(6);

    expect(keys[0].index).toBe(0);
    expect(keys[1].index).toBe(1);
  });
});
