import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RequestModule, RequestService } from '../src';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const fetchService = moduleRef.get(RequestService);

    expect(fetchService.json).toBeDefined();
    expect(fetchService.text).toBeDefined();
  };

  test('Module', async () => {
    await testModules([RequestModule]);
  });

  test('forRoot', async () => {
    await testModules([RequestModule.forRoot()]);
  });

  test('forFeature', async () => {
    await testModules([RequestModule.forFeature()]);
  });
});
