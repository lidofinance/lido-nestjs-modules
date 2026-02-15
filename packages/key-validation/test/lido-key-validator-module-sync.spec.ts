import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  LidoKeyValidatorModule,
  LidoKeyValidatorInterface,
  LidoKeyValidator,
  MultiThreadedKeyValidatorExecutor,
  SingleThreadedKeyValidatorExecutor,
} from '../src';
import { StakingRouterContractModule } from '@lido-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';
import { InterfaceTag } from '@lido-nestjs/di';
import { Type, Abstract } from '@nestjs/common';

describe('LidoKeyValidator sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  const testModules = async <Interface, TInput>(
    imports: ModuleMetadata['imports'],
    tagOrTypeOrToken:
      | InterfaceTag<Interface>
      | (Type<TInput> | Abstract<TInput> | string | symbol),
  ) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    return moduleRef.get(tagOrTypeOrToken);
  };

  test('forRoot - single threaded', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forRoot({ multithreaded: false }),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator.validateKey).toBeDefined();
    expect(lidoKeyValidator.validateKeys).toBeDefined();

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded (default)', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forRoot(),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forRoot({ multithreaded: true }),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - single threaded', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forFeature({ multithreaded: false }),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded (default)', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forFeature(),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded', async () => {
    const lidoKeyValidator = await testModules(
      [
        StakingRouterContractModule.forRoot({ provider }),
        LidoKeyValidatorModule.forFeature({ multithreaded: true }),
      ],
      LidoKeyValidatorInterface,
    );

    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidator);
    expect(lidoKeyValidator).toBeInstanceOf(LidoKeyValidatorInterface);
    expect(lidoKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });
});
