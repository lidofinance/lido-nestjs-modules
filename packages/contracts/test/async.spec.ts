import { getDefaultProvider } from '@ethersproject/providers';
import { hexZeroPad } from '@ethersproject/bytes';
import { DynamicModule, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';
import { ContractModule } from '../src/contract.module';

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
  const provider = getDefaultProvider('mainnet');

  const testModules = async (Module: typeof ContractModule) => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        Module.forRootAsync({
          async useFactory(testService: TestService) {
            return { address: testService.address, provider };
          },
          inject: [TestService],
        }),
      ],
    }).compile();
    const contract: Lido = moduleRef.get(LIDO_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.address).toBeDefined();
    expect(contract.address).toBe(address);
  };

  test('forRootAsync', async () => {
    await testModules(LidoContractModule);
  });

  test('forFeatureAsync', async () => {
    await testModules(LidoContractModule);
  });
});
