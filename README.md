# Lido NestJS Modules

NestJS modules for Lido Finance projects.

## Packages

- [@lido-nestjs/logger](/packages/logger/README.md)
- [@lido-nestjs/fetch](/packages/fetch/README.md)
- [@lido-nestjs/consensus](/packages/consensus/README.md)

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