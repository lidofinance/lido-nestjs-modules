#!/bin/sh

npx openapi-typescript \
  https://github.com/ethereum/beacon-APIs/releases/download/v2.1.0/beacon-node-oapi.json \
  --prettier-config .prettierrc \
  --output ./src/interfaces/generated.interface.ts
