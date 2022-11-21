import { Module, DynamicModule } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common';
import { IpfsNopKeysService } from './ipfs.nop-keys.service';

type NopIpfsModuleOptions = Pick<ModuleMetadata, 'imports'>;

@Module({
  providers: [IpfsNopKeysService],
  exports: [IpfsNopKeysService],
})
export class IpfsNopKeysModule {
  static forRoot(options: NopIpfsModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options: NopIpfsModuleOptions): DynamicModule {
    const { imports } = options;

    return {
      module: IpfsNopKeysModule,
      imports,
    };
  }
}
