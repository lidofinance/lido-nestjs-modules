import { DynamicModule, Module } from '@nestjs/common';
import { LidoContractModule } from '@lido-nestjs/contracts';
import {
  LidoKeyValidatorInterface,
  KeyValidatorInterface,
  KeyValidatorExecutorInterface,
  WithdrawalCredentialsExtractorInterface,
} from './interfaces';
import { KeyValidatorModuleOptions } from './interfaces/module.options';
import { KeyValidator } from './services/key-validator';
import { SingleThreadedKeyValidatorExecutor } from './services/key-validator-executor';
import { WithdrawalCredentialsFetcher } from './services/withdrawal-credentials-fetcher';

@Module({
  imports: [LidoContractModule],
  providers: [
    {
      provide: KeyValidatorInterface,
      useClass: KeyValidator,
    },
    {
      provide: KeyValidatorExecutorInterface,
      useClass: SingleThreadedKeyValidatorExecutor,
    },
    {
      provide: KeyValidatorExecutorInterface,
      useClass: SingleThreadedKeyValidatorExecutor,
    },
    {
      provide: WithdrawalCredentialsExtractorInterface,
      useClass: WithdrawalCredentialsFetcher,
    },
  ],
  exports: [KeyValidatorInterface],
})
export class KeyValidatorModule {
  static forRoot(options?: KeyValidatorModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: KeyValidatorModuleOptions): DynamicModule {
    return {
      module: KeyValidatorModule,
      providers: [
        {
          provide: KeyValidatorInterface,
          useClass: KeyValidator,
        },
        {
          provide: KeyValidatorExecutorInterface,
          useClass: SingleThreadedKeyValidatorExecutor,
        },
        {
          provide: KeyValidatorExecutorInterface,
          useClass: SingleThreadedKeyValidatorExecutor,
        },
        {
          provide: WithdrawalCredentialsExtractorInterface,
          useClass: WithdrawalCredentialsFetcher,
        },
      ],
      exports: [LidoKeyValidatorInterface],
    };
  }
}
