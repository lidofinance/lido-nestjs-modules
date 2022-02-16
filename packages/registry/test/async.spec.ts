import { hexZeroPad } from '@ethersproject/bytes';
import { DynamicModule, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RegistryModule, RegistryService } from '../src';

const address = hexZeroPad('0x12', 20);

@Injectable()
class TestService {
  public address = address;
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
  const testModules = async (Module: typeof RegistryModule) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        Module.forRootAsync({
          async useFactory(testService: TestService) {
            // TODO: config
            return { address: testService.address };
          },
          inject: [TestService],
        }),
      ],
    }).compile();
    const registryService: RegistryService = moduleRef.get(RegistryService);

    expect(registryService.updateStoredData).toBeDefined();
  };

  test('forRootAsync', async () => {
    await testModules(RegistryModule);
  });

  test('forFeatureAsync', async () => {
    await testModules(RegistryModule);
  });
});
