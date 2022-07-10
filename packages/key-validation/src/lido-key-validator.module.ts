import { DynamicModule, Module } from '@nestjs/common';
import { LidoKeyValidator } from './lido-key-validator.service';
import { LidoContractModule } from '@lido-nestjs/contracts';
import { LidoKeyValidatorInterface } from './interfaces/lido-key-validator.interface';
import { KeyValidatorModuleOptions } from './interfaces/module.options';
import { MultithreadedLidoKeyValidator } from './multithreaded-lido-key-validator.service';

@Module({
  imports: [LidoContractModule],
  providers: [
    {
      provide: LidoKeyValidatorInterface,
      useClass: LidoKeyValidator,
    },
  ],
  exports: [LidoKeyValidatorInterface],
})
export class LidoKeyValidatorModule {
  static forRoot(options?: KeyValidatorModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: KeyValidatorModuleOptions): DynamicModule {
    return {
      module: LidoKeyValidatorModule,
      providers: [
        options?.multithreaded
          ? {
              provide: LidoKeyValidatorInterface,
              useClass: MultithreadedLidoKeyValidator,
            }
          : {
              provide: LidoKeyValidatorInterface,
              useClass: LidoKeyValidator,
            },
      ],
      exports: [LidoKeyValidatorInterface],
    };
  }
}
