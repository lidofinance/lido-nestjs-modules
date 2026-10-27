# Registry Module

NestJS Registry Module for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/registry
```

**NestJS 11 with MikroORM 5.** `@mikro-orm/nestjs` 5.x declares `@nestjs/*` peers only up to ^10.
Yarn prints a peer warning and works. npm 7+ fails with `ERESOLVE`; add this to the app's
`package.json` (or install with `--legacy-peer-deps`):

```json
"overrides": {
  "@mikro-orm/nestjs": {
    "@nestjs/common": "$@nestjs/common",
    "@nestjs/core": "$@nestjs/core"
  }
}
```

## Migrations

Database migrations are placed in `./src/migrations/` folder.

Please DO NOT edit migrations, if you want to change the migration,
please make another one with the needed database schema transitions.

## Usage

TODO
