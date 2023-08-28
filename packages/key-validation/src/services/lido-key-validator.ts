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
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

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
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

    return await this.validateLidoKeysForDifferentPossibleWC(
      lidoKeys,
      possibleWC,
    );
  }

  protected async validateLidoKeysForDifferentPossibleWC<T>(
    lidoKeys: (LidoKey & T)[],
    possibleWC: PossibleWC,
  ): Promise<[Key & LidoKey & T, boolean][]> {
    const chainId = await this.wcExtractor.getChainId();
    const genesisForkVersion =
      await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    const unUsedKeys = lidoKeys
      .filter((lidoKey) => !lidoKey.used)
      .map((lidoKey) =>
        this.lidoKeyToBasicKey<T>(
          lidoKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    const usedKeys = lidoKeys
      .filter((lidoKey) => lidoKey.used)
      .map((lidoKey) =>
        this.lidoKeyToBasicKey<T>(
          lidoKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    // 1. first step of validation - unused keys with ONLY current WC
    const unUsedKeysResults = await this.keyValidator.validateKeys<LidoKey & T>(
      unUsedKeys.map((key) => ({
        ...key,
        withdrawalCredentials: possibleWC.currentWC[1],
      })),
    );

    let usedKeysResults: typeof unUsedKeysResults = [];

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

      usedKeysResults = usedKeysResults.concat(validKeys);
    }

    usedKeysResults = usedKeysResults.concat(notValidKeys);

    return usedKeysResults.concat(unUsedKeysResults);
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
