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

## How to add new abi ?!

1. Put abi into packages/contracts/abi folder
2. Set up packages/contracts/<your name of abi>: module, contracts
3. Nice to have: add test for abi. packages/contracts/test/contracts.spec.ts
4. Go through install faq.
5. Enjoy.
