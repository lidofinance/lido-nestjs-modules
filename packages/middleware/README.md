# Middleware

NestJS Middleware Module for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/middleware
```

## Usage

### Basic usage

```ts
// Import
import { Module } from '@nestjs/common';
import { MiddlewareModule } from '@lido-nestjs/middleware';
import { MyService } from './my.service';

@Module({
  imports: [
    MiddlewareModule.forFeature({
      middlewares: [
        (next) => {
          console.log(1);
          next();
          console.log(3);
        },
      ],
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { MiddlewareService } from '@lido-nestjs/middleware';

export class MyService {
  constructor(private middlewareService: MiddlewareService) {}

  async myMethod() {
    return await this.middlewareService.go(() => {
      console.log(2);
    });
  }
}
```
