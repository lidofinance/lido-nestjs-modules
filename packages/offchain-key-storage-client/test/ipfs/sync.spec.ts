import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { IpfsGeneralService, IpfsModule, IpfsNopKeysService } from '../../src';
import { ModuleMetadata } from '@nestjs/common';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const ipfsGeneralService = moduleRef.get(IpfsGeneralService);
    expect(ipfsGeneralService.add).toBeDefined();
    expect(ipfsGeneralService.get).toBeDefined();

    const ipfsNopKeysService = moduleRef.get(IpfsNopKeysService);
    expect(ipfsNopKeysService.add).toBeDefined();
    expect(ipfsNopKeysService.get).toBeDefined();

    return moduleRef;
  };
  test('forFeature', async () => {
    await testModules([
      IpfsModule.forFeature({ imports: [FetchModule.forFeature()] }),
    ]);
    await testModules([
      IpfsModule.forFeature({
        imports: [FetchModule],
      }),
    ]);
  });
  test('forRoot', async () => {
    await testModules([
      IpfsModule.forRoot({
        imports: [FetchModule.forFeature()],
      }),
    ]);
    await testModules([
      IpfsModule.forRoot({
        imports: [FetchModule],
      }),
    ]);
    await testModules([IpfsModule.forRoot(), FetchModule.forRoot()]);
    await testModules([IpfsModule.forRoot(), FetchModule.forRoot()]);
  });
});
