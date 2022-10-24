import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  KeyValidator,
  KeyValidatorInterface,
  KeyValidatorModule,
  MultiThreadedKeyValidatorExecutor,
  SingleThreadedKeyValidatorExecutor,
} from '../src';
import {
  InterfaceTag,
  InterfaceFromTag,
  isInterfaceTag,
} from '@lido-nestjs/di';
import { Type, Abstract } from '@nestjs/common';

describe('KeyValidator sync module initializing', () => {
  const testModules = async <Interface, TInput>(
    imports: ModuleMetadata['imports'],
    tagOrTypeOrToken:
      | InterfaceTag<Interface>
      | (Type<TInput> | Abstract<TInput> | string | symbol),
  ) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    if (isInterfaceTag<Interface>(tagOrTypeOrToken)) {
      return <InterfaceFromTag<typeof tagOrTypeOrToken>>(
        moduleRef.get(tagOrTypeOrToken)
      );
    }

    return moduleRef.get(tagOrTypeOrToken);
  };

  test('forRoot - single threaded', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forRoot({ multithreaded: false })],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded (default)', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forRoot()],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded ()', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forRoot({ multithreaded: true })],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - single threaded', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forFeature({ multithreaded: false })],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded (default)', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forRoot()],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded', async () => {
    const keyValidator = await testModules(
      [KeyValidatorModule.forRoot({ multithreaded: true })],
      KeyValidatorInterface,
    );

    expect(keyValidator.validateKey).toBeDefined();
    expect(keyValidator.validateKeys).toBeDefined();

    expect(keyValidator).toBeInstanceOf(KeyValidator);
    expect(keyValidator).toBeInstanceOf(KeyValidatorInterface);
    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });
});
