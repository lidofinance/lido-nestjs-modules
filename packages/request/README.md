# Request

NestJS Fetch for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

The module is based on the [node-fetch](https://www.npmjs.com/package/node-fetch) package.

## Install

```bash
yarn add @lido-nestjs/request
```

## Usage

### Basic usage

```ts
// Import
import { Module } from '@nestjs/common';
import { RequestModule } from '@lido-nestjs/request';
import { MyService } from './my.service';

@Module({
  imports: [RequestModule.forFeature()],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { RequestService } from '@lido-nestjs/request';

export class MyService {
  constructor(private requestService: RequestService) {}

  async myFetch() {
    return await this.requestService.json({ url: '/url' });
  }
}
```

The `requestService` provides 2 methods: `json` and `text`, which are based on a call to the `fetch` function followed by a call to `.json()` or `.text()`. Method arguments are compatible with the `fetch`.

### Global usage

```ts
import { Module } from '@nestjs/common';
import { RequestModule } from '@lido-nestjs/request';

@Module({
  imports: [RequestModule.forRoot()],
})
export class MyModule {}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { RequestModule } from '@lido-nestjs/request';
import { ConfigModule, ConfigService } from './my.service';

@Module({
  imports: [
    ConfigModule,
    RequestModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return { url: configService.url };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MyModule {}
```

### Middlewares

Middlewares - is a main difference between request module and fetch module

#### Global middlewares

You can add global middlewares into the Module instance. These middlewares will be used for each request.
For example this _standard_ middlewares will be repeated request on each network error 4 times and change the base url on each failure.

Let's setup our module

```ts
import { Module } from '@nestjs/common';
import {
  RequestModule,
  repeat,
  rotate,
  notOkError,
} from '@lido-nestjs/request';
import { ConfigModule, ConfigService } from './my.service';

@Module({
  imports: [
    ConfigModule,
    RequestModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return {
          middlewares: [repeat(5), rotate(configService.baseUrls), notOkError],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MyModule {}
```

And use it

```ts
import { RequestService } from '@lido-nestjs/request';

export class MyService {
  constructor(private requestService: RequestService) {}

  async myFetch() {
    return await this.requestService.json({ url: '/url' });
  }
}
```
