import { Module, DynamicModule } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common';
import { IpfsGeneralService } from './ipfs.general.service';
import { IpfsNopKeysService } from './ipfs.nop-keys.service';

type IpfsModuleOptions = Pick<ModuleMetadata, 'imports'>;

@Module({
  providers: [IpfsGeneralService, IpfsNopKeysService],
  exports: [IpfsGeneralService, IpfsNopKeysService],
})
export class IpfsModule {
  static forRoot(options?: IpfsModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }
  static forFeature(options?: IpfsModuleOptions): DynamicModule {
    const { imports } = options || {};
    return {
      module: IpfsModule,
      imports,
    };
  }
}
