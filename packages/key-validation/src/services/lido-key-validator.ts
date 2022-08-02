import { Injectable } from '@nestjs/common';
import { LidoKeyValidatorInterface } from '../interfaces/lido-key-validator.interface';
import { LidoKey, PossibleWC, Pubkey } from '../interfaces/common';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { WithdrawalCredentialsExtractorInterface } from '../interfaces/withdrawal-credentials.extractor.interface';
import { GenesisForkVersionServiceInterface } from '../interfaces/genesis-fork-version.interface';
import { KeyValidatorInterface } from '../interfaces/key-validator.interface';

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
  ): Promise<[Pubkey, boolean]> {
    const chainId = await this.wcExtractor.getChainId();
    const possibleWC = await this.wcExtractor.getPossibleWithdrawalCredentials();
    const genesisForkVersion = await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    return (await this.validateLidoKeysForPossibleWC(possibleWC, [lidoKey], genesisForkVersion))[0];
  }

  public async validateKeys(
    lidoKeys: LidoKey[],
  ): Promise<[Pubkey, boolean][]> {
    if (lidoKeys.length === 0) {
      return [];
    }

    const chainId = await this.wcExtractor.getChainId();
    const possibleWC = await this.wcExtractor.getPossibleWithdrawalCredentials();
    const genesisForkVersion = await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    return await this.validateLidoKeysForPossibleWC(possibleWC, lidoKeys, genesisForkVersion);
  }

  protected async validateLidoKeysForPossibleWC(
    possibleWC: PossibleWC,
    lidoKeys: LidoKey[],
    genesisForkVersion: Buffer,
  ): Promise<[Pubkey, boolean][]> {

    const unUsedKeys = lidoKeys.filter(lidoKey => !lidoKey.used);
    const usedKeys = lidoKeys.filter(lidoKey => lidoKey.used);

    const unUsedKeysResults: [Pubkey, boolean][] = await this.keyValidator.validateKeys(unUsedKeys.map(key => ({...key, wc: possibleWC.currentWC[1] })), genesisForkVersion);

    const usedKeysResults: [Pubkey, boolean][] = await this.keyValidator.validateKeys(usedKeys.map(key => ({...key, wc: possibleWC.currentWC[1] })), genesisForkVersion);

    const results: [Pubkey, boolean][] = [];

    // TODO solve performance issue when there are many keys
    for (let previousWC of possibleWC.previousWC) {

      const resultsForWC = await this.keyValidator.validateKeys(usedKeys.map(key => ({...key, wc: previousWC[1] })), genesisForkVersion);
      results.push(...resultsForWC);
    }

    // const resultsForCurrentWC = validateKey(
    //   lidoKey,
    //   possibleWC.currentWC[1],
    //   genesisForkVersion,
    // );
    //
    // if (resultsForCurrentWC) {
    //   return [lidoKey.key, resultsForCurrentWC];
    // }
    //
    // const resultsForOldWC = possibleWC.previousWC.map((wc) =>
    //   validateKey(lidoKey, wc[1], genesisForkVersion),
    // );

    //return [lidoKey.key, resultsForOldWC.some((x) => x)];

    return [];
  };
}
