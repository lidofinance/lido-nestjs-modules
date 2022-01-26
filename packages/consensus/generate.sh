#!/bin/bash

oapi="https://github.com/ethereum/beacon-APIs/releases/download/v2.1.0/beacon-node-oapi.json"
filename="./src/interfaces/generated.interface.ts"
prettierrc="../../.prettierrc"

# generate types
npx openapi-typescript@5.1.1 $oapi --output $filename

# fix statuses in getStateValidators query
search="        ) &"
replace="        ) |"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # it requres gnu-sed on macos
  gsed -i "s/$search/$replace/" $filename
else
  sed -i "s/$search/$replace/" $filename
fi

# format file with prettier
npx prettier --config $prettierrc --write $filename
