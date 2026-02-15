import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  GenesisForkVersionService,
  LidoKeyValidator,
  WithdrawalCredentialsFetcher,
} from './services';
import { KeyValidatorModuleSyncOptions } from './interfaces/module.options';
import { KeyValidatorModule } from './key-validator.module';
import {
  GenesisForkVersionServiceInterface,
  LidoKeyValidatorInterface,
  WithdrawalCredentialsExtractorInterface,
} from './interfaces';
import { StakingRouterContractModule } from '@lido-nestjs/contracts';

export const getDefaultLidoKeyValidatorModuleProviders = (): Provider[] => [
  {
    provide: LidoKeyValidatorInterface,
    useClass: LidoKeyValidator,
  },
  {
    provide: GenesisForkVersionServiceInterface,
    useClass: GenesisForkVersionService,
  },
  {
    provide: WithdrawalCredentialsExtractorInterface,
    useClass: WithdrawalCredentialsFetcher,
  },
];

@Module({})
export class LidoKeyValidatorModule {
  static forRoot(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      module: LidoKeyValidatorModule,
      imports: [
        StakingRouterContractModule,
        KeyValidatorModule.forFeature({
          multithreaded: options ? options.multithreaded : true,
        }),
      ],
      providers: getDefaultLidoKeyValidatorModuleProviders(),
      exports: [LidoKeyValidatorInterface],
    };
  }
}
