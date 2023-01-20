import { NestFactory } from '@nestjs/core';
import { MyModule } from './my.module';

async function bootstrap() {
  await NestFactory.create(MyModule);
}

bootstrap();
