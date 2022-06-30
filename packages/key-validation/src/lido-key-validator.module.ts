import { DynamicModule, Module } from '@nestjs/common';
import { LidoKeyValidator } from './lido-key-validator.service';
import { LidoContractModule } from '@lido-nestjs/contracts';

@Module({
  imports: [LidoContractModule],
  providers: [LidoKeyValidator],
  exports: [LidoKeyValidator],
})
export class LidoKeyValidatorModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      ...this.forFeature(),
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: LidoKeyValidatorModule,
      providers: [LidoKeyValidator],
      exports: [LidoKeyValidator],
    };
  }
}
