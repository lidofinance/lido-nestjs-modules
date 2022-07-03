import { DynamicModule, Global, LoggerService, Module } from '@nestjs/common';
import { createMockLogger } from './mock';

@Global()
@Module({})
export class MockLoggerModule {
  public static forRoot(options: LoggerService): DynamicModule {
    return createMockLogger(options);
  }

  public static forRootAsync(options: LoggerService): DynamicModule {
    return createMockLogger(options);
  }
}
