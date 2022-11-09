jest.mock('node-fetch-cjs');

import fetch from 'node-fetch-cjs';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { FetchModule } from '@lido-nestjs/fetch';
import { Test } from '@nestjs/testing';
import { ConsensusModule, ConsensusService } from '../src';

const { Response } = jest.requireActual('node-fetch-cjs');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

@Injectable()
class TestService {
  public interval = 123;
}
@Module({
  providers: [TestService],
  exports: [TestService],
})
class TestModule {
  static forRoot(): DynamicModule {
    return {
      module: TestModule,
      global: true,
    };
  }
}

describe('Async module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}))),
    );

    const consensusService = await moduleRef.resolve(ConsensusService);
    const testService = await moduleRef.resolve(TestService);

    expect(consensusService.options.pollingInterval).toBeDefined();
    expect(consensusService.options.pollingInterval).toBe(testService.interval);
  };

  const factory = {
    async useFactory(testService: TestService) {
      return { pollingInterval: testService.interval };
    },
    inject: [TestService],
  };

  test('forRootAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      FetchModule.forRoot(),
      ConsensusModule.forRootAsync(factory),
    ]);

    await testModules([
      ConsensusModule.forRootAsync({
        imports: [TestModule, FetchModule.forFeature()],
        ...factory,
      }),
    ]);
  });

  test('forFeatureAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      FetchModule.forRoot(),
      ConsensusModule.forFeatureAsync(factory),
    ]);

    await testModules([
      ConsensusModule.forFeatureAsync({
        imports: [TestModule, FetchModule.forFeature()],
        ...factory,
      }),
    ]);
  });
});
