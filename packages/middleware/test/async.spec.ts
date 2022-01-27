import { DynamicModule, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MiddlewareModule, MiddlewareService } from '../src';

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
  test('Global middleware + global test', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        MiddlewareModule.forRootAsync({
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
        }),
      ],
    }).compile();

    const middlewareService = await moduleRef.resolve(MiddlewareService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    middlewareService.go(() => void 0);
    expect(testService.foo).toBeCalledTimes(1);
  });

  test('Global middleware + local test', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MiddlewareModule.forRootAsync({
          imports: [TestModule],
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
        }),
      ],
    }).compile();

    const middlewareService = await moduleRef.resolve(MiddlewareService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    middlewareService.go(() => void 0);
    expect(testService.foo).toBeCalledTimes(1);
  });

  test('Local middleware + global test', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        MiddlewareModule.forFeatureAsync({
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
        }),
      ],
    }).compile();

    const middlewareService = await moduleRef.resolve(MiddlewareService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    middlewareService.go(() => void 0);
    expect(testService.foo).toBeCalledTimes(1);
  });

  test('Local middleware + local test', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MiddlewareModule.forFeatureAsync({
          imports: [TestModule],
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
        }),
      ],
    }).compile();

    const middlewareService = await moduleRef.resolve(MiddlewareService);
    const testService = await moduleRef.resolve(TestService);

    expect(testService.foo).toBeCalledTimes(0);
    middlewareService.go(() => void 0);
    expect(testService.foo).toBeCalledTimes(1);
  });
});
