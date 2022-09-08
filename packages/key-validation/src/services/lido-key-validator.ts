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

  public async validateKey(
    lidoKey: LidoKey,
  ): Promise<[Key & LidoKey, boolean]> {
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

    return (
      await this.validateLidoKeysForDifferentPossibleWC([lidoKey], possibleWC)
    )[0];
  }

  public async validateKeys(
    lidoKeys: LidoKey[],
  ): Promise<[Key & LidoKey, boolean][]> {
    if (lidoKeys.length === 0) {
      return [];
    }
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

    return await this.validateLidoKeysForDifferentPossibleWC(
      lidoKeys,
      possibleWC,
    );
  }

  protected async validateLidoKeysForDifferentPossibleWC(
    lidoKeys: LidoKey[],
    possibleWC: PossibleWC,
  ): Promise<[Key & LidoKey, boolean][]> {
    const chainId = await this.wcExtractor.getChainId();
    const genesisForkVersion =
      await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    const unUsedKeys = lidoKeys
      .filter((lidoKey) => !lidoKey.used)
      .map((lidoKey) =>
        this.lidoKeyToBasicKey(
          lidoKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    const usedKeys = lidoKeys
      .filter((lidoKey) => lidoKey.used)
      .map((lidoKey) =>
        this.lidoKeyToBasicKey(
          lidoKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    // 1. first step of validation - unused keys with ONLY current WC
    const unUsedKeysResults = await this.keyValidator.validateKeys<LidoKey>(
      unUsedKeys.map((key) => ({
        ...key,
        withdrawalCredentials: possibleWC.currentWC[1],
      })),
    );

    const usedKeysResults: typeof unUsedKeysResults = [];

    let remainingKeys = usedKeys;
    let notValidKeys: typeof usedKeysResults = [];

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

      const validKeys = resultsForWC.filter((res) => res[1]);

      // Adding not valid keys for next iteration
      notValidKeys = resultsForWC.filter((res) => !res[1]);
      remainingKeys = notValidKeys.map((res) => res[0]);

      usedKeysResults.push(...validKeys);
    }

    usedKeysResults.push(...notValidKeys);

    return [...usedKeysResults, ...unUsedKeysResults];
  }

  protected lidoKeyToBasicKey(
    lidoKey: LidoKey,
    withdrawalCredentials: WithdrawalCredentialsBuffer,
    genesisForkVersion: Buffer,
  ): Key & LidoKey {
    return {
      ...lidoKey,
      withdrawalCredentials: withdrawalCredentials,
      genesisForkVersion,
    };
  }
}
