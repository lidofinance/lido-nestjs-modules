# Nest JS Dependency Injection runtime helpers

NestJS Dependency Injection runtime helpers for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/di
```

## Motivation

This module exists to solve following things:

1. the lack of runtime interfaces in Typescript
2. necessity of `@Inject` decorators for constructor arguments when working with NestJS
3. use of `Symbol` to point to specific implementation when working with NestJS

## The problem

When working with NestJS in case you need two different implementations of one interface,
you have to introduce multiple tokens (symbols), which point to different implementations.

```ts
// bar-service.interface.ts
export interface BarServiceInterface {
  someMethod(): string;
}
```

```ts
// bar-service-a.ts
export const BarServiceAToken = Symbol();

export class BarServiceA implements BarServiceInterface {
  someMethod(): string {
    return 'BarServiceA';
  }
}
```

```ts
// bar-service-b.ts
export const BarServiceBToken = Symbol();

export class BarServiceB implements BarServiceInterface {
  someMethod(): string {
    return 'BarServiceB';
  }
}
```

```ts
// foo-service.ts
import { Inject, Injectable } from '@nestjs/common';
import { BarServiceInterface } from './bar-service.interface';
import { BarServiceAToken } from './bar-service-a';
import { BarServiceBToken } from './bar-service-b';

@Injectable()
export class FooService {
  // it's necessary to inject `BarServiceAToken` symbol here to point to specific implementation
  public constructor(
    @Inject(BarServiceAToken) private barService: BarServiceInterface,
  ) {}

  public checkInstanceOf() {
    // this is impossible because Typescript types do not exist in runtime
    this.barService instanceof BarServiceInterface;
  }
}
```

## Solution

Module exposes two primitives:

1. `createInterface<I>(nameOfInterface: string): InterfaceTag<I>` function.

Creates special interface-like anonymous class `InterfaceTag` that acts like an interface
utilizing `Symbol.hasInstance` method that allows to override behavior of `instanceof` operator.

2. `@ImplementsAtRuntime<T>(interfaceTag: InterfaceTag<T>): ClassDecorator` class decorator

Class decorator indicating that class implements interface at runtime with the help of `Reflect`.
Needed for proper work of `instanceof` operator for class instances.

## Usage

### Basic usage

```ts
import { createInterface, ImplementsAtRuntime } from '@lido-nestjs/di';

interface FooInterface {
  foo(): string;
}

interface BarInterface {
  bar(): number;
}

const FooInterface = createInterface<FooInterface>('FooInterface');
const BarInterface = createInterface<BarInterface>('BarInterface');

@ImplementsAtRuntime(FooInterface)
export class FooBar implements FooInterface, BarInterface {
  bar(): number {
    return 2;
  }

  foo(): string {
    return 'bar';
  }
}

const foobar = new FooBar();

console.log(foobar instanceof FooInterface === true); // true
console.log(foobar instanceof BarInterface === true); // true
```

### Nest.js usage

```ts
// service.interface.ts
import { createInterface } from '@lido-nestjs/di';

export interface ServiceInterface {
  doSmth(): string;
}
// the interface name and the name of the constant should be the same
export const ServiceInterface = createInterface<ServiceInterface>('ServiceInterface');
```

```ts
// service.ts
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { Injectable } from '@nestjs/common';

// here, we are importing the type and the constant in one variable 'ServiceInterface'
import { ServiceInterface } from './service.interface';

@Injectable()
@ImplementsAtRuntime(ServiceInterface)
export class ServiceA implements ServiceInterface {
  doSmth(): string {
    return 'serviceA';
  }
}

@Injectable()
@ImplementsAtRuntime(ServiceInterface)
export class ServiceB implements ServiceInterface {
  doSmth(): string {
    return 'serviceB';
  }
}
```

```ts
// service.module.ts
import { Injectable } from '@nestjs/common';
import { ServiceA, ServiceB } from './service';
import { ServiceInterface } from './service.interface';

export interface ServiceModuleOptions {
  service: 'A' | 'B';
}

@Module({})
export class ServiceModule {
  static forRoot(options?: ServiceModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: ServiceModuleOptions): DynamicModule {
    return {
      module: ServiceModule,
      // depending on the options module can provide
      // different immplementation for `ServiceInterface`
      providers: [
        options?.service === 'A'
          ? {
              provide: ServiceInterface,
              useClass: ServiceA,
            }
          : {
              provide: ServiceInterface,
              useClass: ServiceB,
            },
      ],
      exports: [ServiceInterface],
    };
  }
}
```

```ts
// some-other-service.ts
export class SomeOtherService {
  // no `@Inject` decorator here
  public constructor(private service: ServiceInterface) {}

  public someMethod() {
    // implementation of doSmth depends on `ServiceModuleOptions` value
    this.service.doSmth();
  }
}
```
