import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { IpfsGeneralService, IpfsModule } from '../../src';
import { ModuleMetadata } from '@nestjs/common';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const ipfsGeneralService = moduleRef.get(IpfsGeneralService);
    expect(ipfsGeneralService.add).toBeDefined();
    expect(ipfsGeneralService.get).toBeDefined();

    return moduleRef;
  };
  test('forFeature', async () => {
    await testModules([
      IpfsModule.forFeature({
        imports: [FetchModule.forFeature()],
        url: '',
        username: '',
        password: '',
      }),
    ]);

    await testModules([
      IpfsModule.forFeature({
        imports: [FetchModule],
        url: '',
        username: '',
        password: '',
      }),
    ]);
  });

  test('forRoot', async () => {
    await testModules([
      IpfsModule.forRoot({
        imports: [FetchModule.forFeature()],
        url: '',
        username: '',
        password: '',
      }),
    ]);
    await testModules([
      IpfsModule.forRoot({
        imports: [FetchModule],
        url: '',
        username: '',
        password: '',
      }),
    ]);
  });
});
