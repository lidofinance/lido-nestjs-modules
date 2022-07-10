import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LidoKeyValidatorModule, LidoKeyValidatorInterface } from '../src';
import { LidoContractModule } from '@lido-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const keyValidator = moduleRef.get(LidoKeyValidatorInterface);

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    return keyValidator;
  };

  test('simple', async () => {
    const keyValidator = await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule,
    ]);

    expect(keyValidator.constructor.name).toBe('LidoKeyValidator');
  });

  test('forRoot - single threaded', async () => {
    const keyValidator = await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forRoot(),
    ]);

    expect(keyValidator.constructor.name).toBe('LidoKeyValidator');
  });

  test('forRoot - multi threaded', async () => {
    const keyValidator = await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forRoot({ multithreaded: true }),
    ]);

    expect(keyValidator.constructor.name).toBe('MultithreadedLidoKeyValidator');
  });

  test('forFeature - single threaded', async () => {
    const keyValidator = await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forFeature(),
    ]);

    expect(keyValidator.constructor.name).toBe('LidoKeyValidator');
  });

  test('forFeature - multi threaded', async () => {
    const keyValidator = await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forFeature({ multithreaded: true }),
    ]);

    expect(keyValidator.constructor.name).toBe('MultithreadedLidoKeyValidator');
  });
});
