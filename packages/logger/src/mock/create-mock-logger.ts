import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '..';

export const createMockLogger = (logger: LoggerService) => {
  const providers = [
    {
      provide: WINSTON_MODULE_NEST_PROVIDER,
      useFactory: () => logger,
    },
  ];
  return {
    module: WinstonModule,
    providers: providers,
    exports: providers,
  };
};
