import { hexZeroPad } from '@ethersproject/bytes';
import { DynamicModule, Injectable, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getNetwork } from '@ethersproject/networks';
import { getDefaultProvider } from '@ethersproject/providers';
import {
  LidoContractModule,
  RegistryContractModule,
} from '@lido-nestjs/contracts';
import { RegistryFetchModule, RegistryFetchService } from '../../src';

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
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const fetchService: RegistryFetchService =
      moduleRef.get(RegistryFetchService);

    expect(fetchService).toBeDefined();
  };

  test('forRootAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forRootAsync({
        async useFactory(/* testService: TestService */) {
          // TODO: config
          return {};
        },
        inject: [TestService],
      }),
    ]);
  });

  test('forFeatureAsync', async () => {
    await testModules([
      TestModule.forRoot(),
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forFeatureAsync({
        async useFactory(/* testService: TestService */) {
          // TODO: config
          return {};
        },
        inject: [TestService],
      }),
    ]);
  });
});
