import { getDefaultProvider, Provider } from '@ethersproject/providers';
import { hexZeroPad } from '@ethersproject/bytes';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';

const address = hexZeroPad('0x12', 20);
const provider = getDefaultProvider(process.env.EL_RPC_URL);

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
  const testModules = async (metadata: ModuleMetadata) => {
    const moduleRef = await Test.createTestingModule(metadata).compile();
    const contract: Lido = moduleRef.get(LIDO_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.address).toBeDefined();
    expect(contract.address).toBe(address);
  };

  test('forRootAsync, Test module, Provider', async () => {
    const module = LidoContractModule.forRootAsync({
      async useFactory(testService: TestService) {
        return { address: testService.address };
      },
      inject: [TestService],
    });
    const providers = [{ provide: Provider, useValue: provider }];

    const imports = [TestModule.forRoot(), module];
    await testModules({ imports, providers });
  });

  test('forFeatureAsync, Test module, Provider', async () => {
    const module = LidoContractModule.forFeatureAsync({
      async useFactory(testService: TestService) {
        return { address: testService.address };
      },
      inject: [TestService],
    });
    const providers = [{ provide: Provider, useValue: provider }];

    const imports = [TestModule.forRoot(), module];
    await testModules({ imports, providers });
  });

  test('forFeatureAsync, Test module, Provider from options', async () => {
    const module = LidoContractModule.forFeatureAsync({
      async useFactory(testService: TestService) {
        return { address: testService.address, provider };
      },
      inject: [TestService],
    });

    const imports = [TestModule.forRoot(), module];
    await testModules({ imports });
  });

  test('forFeatureAsync, Provider from options', async () => {
    const module = LidoContractModule.forFeatureAsync({
      async useFactory() {
        return { address, provider };
      },
    });

    const imports = [module];
    await testModules({ imports });
  });

  test('Without provider', async () => {
    await expect(() =>
      Test.createTestingModule({
        imports: [
          LidoContractModule.forFeatureAsync({
            async useFactory() {
              return { address };
            },
          }),
        ],
      }).compile(),
    ).rejects.toThrowError();

    await expect(() =>
      Test.createTestingModule({
        imports: [
          LidoContractModule.forFeatureAsync({
            async useFactory() {
              return { address };
            },
          }),
        ],
      }).compile(),
    ).rejects.toThrowError();
  });
});
