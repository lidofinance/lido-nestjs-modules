jest.mock('node-fetch');

import fetch from 'node-fetch';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  RequestModule,
  RequestModuleAsyncOptions,
  RequestService,
} from '../src';

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

    const fetchService = await moduleRef.resolve(RequestService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    fetchService.json({ url: '/foo' });
    expect(testService.foo).toBeCalledTimes(1);
  };

  const factory: RequestModuleAsyncOptions = {
    async useFactory(testService: TestService) {
      return {
        middlewares: [
          (config, next) => {
            testService.foo();
            return next(config);
          },
        ],
      };
    },
    inject: [TestService],
  };

  test('forRootAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      RequestModule.forRootAsync(factory),
    ]);

    await testModules([
      RequestModule.forRootAsync({
        imports: [TestModule],
        ...factory,
      }),
    ]);
  });

  test('forFeatureAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      RequestModule.forFeatureAsync(factory),
    ]);

    await testModules([
      RequestModule.forFeatureAsync({
        imports: [TestModule],
        ...factory,
      }),
    ]);
  });
});
