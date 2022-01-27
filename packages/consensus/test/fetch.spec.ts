import { Test } from '@nestjs/testing';
import {
  FetchModule,
  FetchModuleOptions,
  FetchService,
} from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';
import { ModuleMetadata } from '@nestjs/common';

describe('Fetch config', () => {
  const options: FetchModuleOptions = { baseUrls: ['1'] };

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    const consensusService = moduleRef.get(ConsensusService);
    const fetchService = moduleRef.get(FetchService);

    expect(consensusService.getBlock).toBeDefined();
    expect(consensusService.fetch).toBeDefined();

    expect(fetchService.options).toBeDefined();
    expect(fetchService.options).toEqual(options);
  };

  test('forRoot', async () => {
    await testModules([
      ConsensusModule.forRoot({ imports: [FetchModule.forFeature(options)] }),
    ]);

    await testModules([
      ConsensusModule.forRoot({}),
      FetchModule.forRoot(options),
    ]);
  });

  test('forFeature', async () => {
    await testModules([
      ConsensusModule.forFeature({
        imports: [FetchModule.forFeature(options)],
      }),
    ]);

    await testModules([
      ConsensusModule.forFeature({}),
      FetchModule.forRoot(options),
    ]);
  });

  test('Module', async () => {
    await testModules([ConsensusModule, FetchModule.forRoot(options)]);
  });
});
