import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';
import { ModuleMetadata } from '@nestjs/common';

describe('Sync module initializing', () => {
  const options = { pollingInterval: 123 };

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    const consensusService = moduleRef.get(ConsensusService);

    expect(consensusService.getBlock).toBeDefined();
    expect(consensusService.fetch).toBeDefined();

    return moduleRef;
  };

  const testWithConfig = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await testModules(imports);
    const consensusService = moduleRef.get(ConsensusService);

    expect(consensusService.options).toBeDefined();
    expect(consensusService.options).toEqual(options);
  };

  test('forRoot', async () => {
    await testWithConfig([
      ConsensusModule.forRoot({
        imports: [FetchModule.forFeature()],
        ...options,
      }),
    ]);

    await testWithConfig([
      ConsensusModule.forRoot({
        imports: [FetchModule],
        ...options,
      }),
    ]);

    await testWithConfig([
      ConsensusModule.forRoot(options),
      FetchModule.forRoot(),
    ]);

    await testModules([ConsensusModule.forRoot(), FetchModule.forRoot()]);
  });

  test('forFeature', async () => {
    await testWithConfig([
      ConsensusModule.forFeature({
        imports: [FetchModule.forFeature()],
        ...options,
      }),
    ]);

    await testWithConfig([
      ConsensusModule.forFeature({
        imports: [FetchModule],
        ...options,
      }),
    ]);

    await testWithConfig([
      ConsensusModule.forFeature(options),
      FetchModule.forRoot(),
    ]);

    await testModules([ConsensusModule.forFeature(), FetchModule.forRoot()]);
  });

  test('Module', async () => {
    await testModules([ConsensusModule, FetchModule.forRoot()]);
  });
});
