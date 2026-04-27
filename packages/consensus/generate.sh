#!/bin/bash

oapi="https://github.com/ethereum/beacon-APIs/releases/download/v5.0.0-alpha.1/beacon-node-oapi.json"
tempfile="./api.json"
filename="./src/interfaces/generated.interface.ts"
prettierrc="../../.prettierrc"

# generate types
wget -O $tempfile $oapi
npx openapi-typescript@5.4.0 $tempfile --output $filename
rm -f $tempfile

# format file with prettier
npx prettier --config $prettierrc --write $filename
