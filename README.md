# Lido NestJS Modules

NestJS modules for Lido Finance projects.

## Packages

- [@lido-nestjs/logger](/packages/logger/README.md)
- [@lido-nestjs/fetch](/packages/fetch/README.md)
- [@lido-nestjs/consensus](/packages/consensus/README.md)
- [@lido-nestjs/execution](/packages/execution/README.md)

## Install

1. `yarn && yarn postinstall`
2. `yarn typechain`
3. `yarn build`

## Usage

- `yarn build` — Build all packages
- `yarn lint` — Run eslint across packages
- `yarn test` — Run tests across packages
- `yarn test:package {package name}` — Run tests for one package
- `yarn test:watch` — Run tests in watch mode
- `yarn test:e2e` — Run E2E tests (ensure $EL_RPC_URL env variable set)

## Migrations

Database migration files should be placed in `/packages/{package name}/src/migrations/` folder.
Migrations filenames should comply with the datetime pattern: `MigrationYYYYMMDDhhmmss.ts`

Where:
* YYYY - year (example: 2022)
* MM - month (example: 01)
* DD - day of month (example: 29)
* hh - hour in 24h format (example: 23)
* mm - minutes (example: 05)
* ss - seconds (example: 02)

Examples: 
 - `Migration20220301040302.ts`
 - `Migration20221129230502.ts`



Please DO NOT edit migrations after they are created and pushed to NPM.
If you want to change the migration, 
please make another one with the needed database schema transitions.
