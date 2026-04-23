import { Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import {
  GenesisForkVersionServiceInterface,
  Key,
  KeyValidatorInterface,
  LidoKey,
  LidoKeyValidatorInterface,
  PossibleWC,
  WithdrawalCredentialsBuffer,
  WithdrawalCredentialsExtractorInterface,
} from '../interfaces';

@Injectable()
@ImplementsAtRuntime(LidoKeyValidatorInterface)
export class LidoKeyValidator implements LidoKeyValidatorInterface {
  public constructor(
    protected readonly keyValidator: KeyValidatorInterface,
    protected readonly wcExtractor: WithdrawalCredentialsExtractorInterface,
    protected readonly genesisForkVersionService: GenesisForkVersionServiceInterface,
  ) {}

  public async validateKey<T>(
    lidoKey: LidoKey & T,
  ): Promise<[Key & LidoKey & T, boolean]> {
    const possibleWC = await this.wcExtractor.getPossibleWithdrawalCredentials(
      lidoKey.moduleId,
    );

    return (
      await this.validateLidoKeysForDifferentPossibleWC([lidoKey], possibleWC)
    )[0];
  }

  public async validateKeys<T>(
    lidoKeys: (LidoKey & T)[],
  ): Promise<[Key & LidoKey & T, boolean][]> {
    if (lidoKeys.length === 0) {
      return [];
    }

    const keysByModule = this.groupKeysByModule(lidoKeys);
    const results: [Key & LidoKey & T, boolean][] = [];

    for (const [moduleId, moduleKeys] of keysByModule) {
      const possibleWC =
        await this.wcExtractor.getPossibleWithdrawalCredentials(moduleId);
      const moduleResults = await this.validateLidoKeysForDifferentPossibleWC(
        moduleKeys,
        possibleWC,
      );
      results.push(...moduleResults);
    }

    return results;
  }

  protected groupKeysByModule<T>(
    keys: (LidoKey & T)[],
  ): Map<number | undefined, (LidoKey & T)[]> {
    const map = new Map<number | undefined, (LidoKey & T)[]>();
    for (const key of keys) {
      const existing = map.get(key.moduleId) ?? [];
      existing.push(key);
      map.set(key.moduleId, existing);
    }

    return map;
  }

  protected async validateLidoKeysForDifferentPossibleWC<T>(
    lidoKeys: (LidoKey & T)[],
    possibleWC: PossibleWC,
  ): Promise<[Key & LidoKey & T, boolean][]> {
    const chainId = await this.wcExtractor.getChainId();
    const genesisForkVersion =
      await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    const unusedKeys = [];
    const usedKeys = [];
    for (const key of lidoKeys) {
      const basicKey = this.lidoKeyToBasicKey<T>(
        key,
        possibleWC.currentWC[1],
        genesisForkVersion,
      );

      if (key.used) {
        usedKeys.push(basicKey);
      } else {
        unusedKeys.push(basicKey);
      }
    }

    // 1. first step of validation - unused keys with ONLY current WC
    const unusedKeysResults = await this.keyValidator.validateKeys<LidoKey & T>(
      unusedKeys,
    );

    let usedKeysResults: [Key & LidoKey & T, boolean][] = [];
    let remainingKeys = usedKeys;

    // TODO solve performance issues when there are many keys
    // 2. second step of validation - used keys with current and multiple previous WC
    for (const wc of [possibleWC.currentWC, ...possibleWC.previousWC]) {
      const resultsForWC = await this.keyValidator.validateKeys(
        // validating keys with previous WC
        remainingKeys.map((key) => ({
          ...key,
          withdrawalCredentials: wc[1],
        })),
      );

      remainingKeys = [];
      for (const res of resultsForWC) {
        if (res[1]) {
          usedKeysResults.push(res);
        } else {
          // Adding not valid keys for next iteration
          remainingKeys.push(res[0]);
        }
      }
    }

    usedKeysResults = usedKeysResults.concat(
      remainingKeys.map((key) => [key, false]),
    );

    return usedKeysResults.concat(unusedKeysResults);
  }

  protected lidoKeyToBasicKey<T>(
    lidoKey: LidoKey & T,
    withdrawalCredentials: WithdrawalCredentialsBuffer,
    genesisForkVersion: Buffer,
  ): Key & LidoKey & T {
    return {
      ...lidoKey,
      withdrawalCredentials: withdrawalCredentials,
      genesisForkVersion,
    };
  }
}
