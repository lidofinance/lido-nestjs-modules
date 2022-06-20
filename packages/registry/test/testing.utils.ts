import { RegistryKey, RegistryMeta, RegistryOperator } from '../src';
import { AbstractRegistryService } from '../src/main/abstract-registry';

type Expected = {
  keys: RegistryKey[];
  operators: RegistryOperator[];
  meta: RegistryMeta;
};

export const compareTestMetaKeys = async (
  registryService: AbstractRegistryService,
  { keys }: Pick<Expected, 'keys'>,
) => {
  expect(keys.sort((a, b) => a.operatorIndex - b.operatorIndex)).toEqual(
    await (
      await registryService.getOperatorsKeysFromStorage()
    ).sort((a, b) => a.operatorIndex - b.operatorIndex),
  );
};

export const compareTestMetaOperators = async (
  registryService: AbstractRegistryService,
  { operators }: Pick<Expected, 'operators'>,
) => {
  expect(operators).toEqual(await registryService.getOperatorsFromStorage());
};

export const compareTestMetaData = async (
  registryService: AbstractRegistryService,
  { meta }: Pick<Expected, 'meta'>,
) => {
  expect(meta).toEqual(await registryService.getMetaDataFromStorage());
};

export const compareTestMeta = async (
  registryService: AbstractRegistryService,
  { keys, meta, operators }: Expected,
) => {
  await compareTestMetaKeys(registryService, { keys });
  await compareTestMetaOperators(registryService, { operators });
  await compareTestMetaData(registryService, { meta });
};
