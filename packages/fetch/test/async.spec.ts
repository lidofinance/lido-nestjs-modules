jest.mock('node-fetch');

import fetch from 'node-fetch';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FetchModule, FetchModuleAsyncOptions, FetchService } from '../src';

const { Response } = jest.requireActual('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

@Injectable()
class TestService {
  public foo = jest.fn();
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
  const expected = { foo: 'bar' };

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(expected))),
    );

    const fetchService = await moduleRef.resolve(FetchService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    fetchService.fetchJson('/foo');
    expect(testService.foo).toBeCalledTimes(1);
  };

  const factory: FetchModuleAsyncOptions = {
    async useFactory(testService: TestService) {
      return {
        middlewares: [
          (next) => {
            testService.foo();
            return next();
          },
        ],
      };
    },
    inject: [TestService],
  };

  test('forRootAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      FetchModule.forRootAsync(factory),
    ]);

    await testModules([
      FetchModule.forRootAsync({
        imports: [TestModule],
        ...factory,
      }),
    ]);
  });

  test('forFeatureAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      FetchModule.forFeatureAsync(factory),
    ]);

    await testModules([
      FetchModule.forFeatureAsync({
        imports: [TestModule],
        ...factory,
      }),
    ]);
  });
});
