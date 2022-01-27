import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '../src';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const fetchService = moduleRef.get(FetchService);

    expect(fetchService.fetchJson).toBeDefined();
    expect(fetchService.fetchText).toBeDefined();
  };

  test('Module', async () => {
    await testModules([FetchModule]);
  });

  test('forRoot', async () => {
    await testModules([FetchModule.forRoot()]);
  });

  test('forFeature', async () => {
    await testModules([FetchModule.forFeature()]);
  });
});
