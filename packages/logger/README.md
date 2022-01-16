# Logger

NestJS Logger for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

The logger is based on [winston logger](https://github.com/winstonjs/winston) and [nest-winston](https://www.npmjs.com/package/nest-winston) package.

## Install

```bash
yarn add @lido-nestjs/logger
```

## Usage

### Basic usage

```ts
import { Module } from '@nestjs/common';
import { LoggerModule, jsonTransport } from '@lido-nestjs/logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      level: 'debug',
      transports: [jsonTransport()],
    }),
  ],
})
export class AppModule {}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { LoggerModule, jsonTransport } from '@lido-nestjs/logger';
import { ConfigModule, ConfigService } from './example';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        level: configService.get('LOG_LEVEL'),
        transports: [jsonTransport()],
      }),
    }),
  ],
})
export class AppModule {}
```

## Transports

The logger provides preconfigured console transports in `json` and `simple` formats. The transports can be imported from `@lido-nestjs/logger`:

```ts
import { simpleTransport, jsonTransport } from '@lido-nestjs/logger';
```

### Secrets cleaner

Preconfigured transports have formatter for clean secrets from logs. To use it, pass an array of secret strings to the transport options:

```ts
import { Module } from '@nestjs/common';
import { LoggerModule, simpleTransport } from '@lido-nestjs/logger';

const PRIVATE_KEY = '0x000000000000';
const secrets = [PRIVATE_KEY];

@Module({
  imports: [
    LoggerModule.forRoot({
      level: 'debug',
      transports: [simpleTransport({ secrets })],
    }),
  ],
})
export class AppModule {}
```

Secrets will be replaced with text `<removed>`.

If you want to use this formatter in your custom transport, import the `cleanSecrets` from `@lido-nestjs/logger`:

```ts
import { cleanSecrets } from '@lido-nestjs/logger';

const myFormatter = winston.format.combine(
  cleanSecrets({ secrets: ['some-secret'] }),
  winston.format.json(),
);

const myTransport = new winston.transports.Console({
  format: myFormatter,
});
```

### Meta fields

Meta fields can be useful for adding additional fields to logs, such as `blockNumber` in Ethereum bots. To add meta fields, pass a `defaultMeta` to logger options:

```ts
import { Module } from '@nestjs/common';
import { LoggerModule, jsonTransport } from '@lido-nestjs/logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      level: 'debug',
      defaultMeta: {
        foo: 'bar',
        get baz() {
          // you can use getter for dynamic data
          return 1 + 1;
        },
      },
      transports: [jsonTransport()],
    }),
  ],
})
export class AppModule {}
```

In this case you will see extra fields in the logs:

```ts
logger.log('some message'); // { foo: 'bar', baz: 2, message: 'some message', ... }
```

### Colorize

For `simple` transport you can set colors for meta fields by passing `fieldColors` in the transport options:

```ts
import { Module } from '@nestjs/common';
import { LoggerModule, simpleTransport } from '@lido-nestjs/logger';

const fieldColors = { foo: 'blue' };

@Module({
  imports: [
    LoggerModule.forRoot({
      level: 'debug',
      defaultMeta: {
        get block() {
          return 1000;
        },
      },
      transports: [simpleTransport({ fieldColors })],
    }),
  ],
})
export class AppModule {}
```

In this case you will see blue value of `block` field in the logs:

```ts
logger.log('some message'); // yyyy-mm-dd hh:mm:ss [1000] info: some message
```

Possible color values can be found in the [winston docs](https://github.com/winstonjs/winston#using-custom-logging-levels).
