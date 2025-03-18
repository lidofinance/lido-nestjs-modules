jest.mock('node-fetch');
import { Test } from '@nestjs/testing';
import {
  FetchModule,
  FetchModuleOptions,
  FetchService,
} from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';
import { ModuleMetadata } from '@nestjs/common';
import fetch from 'node-fetch';

const { Response } = jest.requireActual('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Fetch config', () => {
  const options: FetchModuleOptions = { baseUrls: ['http://foo.bar'] };
  const expected = { foo: 'bar' };

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    const consensusService = moduleRef.get(ConsensusService);
    const fetchService = moduleRef.get(FetchService);

    expect(consensusService.getBlockV2).toBeDefined();
    expect(consensusService.fetch).toBeDefined();

    expect(fetchService.options).toBeDefined();
    expect(fetchService.options).toEqual(options);

    mockFetch.mockReset();
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(expected))),
    );

    const result = await consensusService.getSpec();
    expect(result).toEqual(expected);
    expect(mockFetch).toBeCalledWith(
      expect.stringContaining(String(options.baseUrls?.[0])),
      undefined,
    );
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
