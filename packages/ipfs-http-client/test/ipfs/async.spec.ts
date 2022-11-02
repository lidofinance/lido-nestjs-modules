import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { IpfsGeneralService, IpfsModule } from '../../src';
import {
  ModuleMetadata,
  Injectable,
  Module,
  DynamicModule,
} from '@nestjs/common';

// Is this Module declaration enough for checking async IpfsModule?
@Injectable()
class ConfigService {
  public url = '';
  public password = '';
  public username = '';
}

@Module({
  imports: [],
  providers: [ConfigService],
  exports: [ConfigService],
})
class ConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: ConfigModule,
      global: true,
    };
  }
}

describe('Async module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    const ipfsGeneralService = moduleRef.get(IpfsGeneralService);

    const fetchService = moduleRef.get(FetchService);

    expect(ipfsGeneralService.add).toBeDefined();
    expect(ipfsGeneralService.get).toBeDefined();

    // нужно ли?
    expect(fetchService.fetchJson).toBeDefined();
    expect(fetchService.fetchText).toBeDefined();

    return moduleRef;
  };

  test('forFeatureAsync', async () => {
    let imports = [
      ConfigModule.forRoot(),
      IpfsModule.forFeatureAsync({
        imports: [FetchModule],
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
    ];
    await testModules(imports);

    // global fecth module
    imports = [
      ConfigModule.forRoot(),
      FetchModule.forRoot(),
      IpfsModule.forFeatureAsync({
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
    ];
  });

  test('forRootAsync', async () => {
    let imports = [
      ConfigModule.forRoot(),
      IpfsModule.forRootAsync({
        imports: [FetchModule],
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
    ];
    await testModules(imports);

    // global fecth module
    imports = [
      ConfigModule.forRoot(),
      FetchModule.forRoot(),
      IpfsModule.forRootAsync({
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
    ];
  });
});
