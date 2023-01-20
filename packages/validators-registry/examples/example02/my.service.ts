import { Injectable } from '@nestjs/common';
import { ValidatorsRegistryInterface } from '@lido-nestjs/validators-registry';

@Injectable()
export class MyService {
  public constructor(
    private readonly validatorsRegistry: ValidatorsRegistryInterface,
  ) {}

  public async myMethod() {
    await this.validatorsRegistry.update(12345);

    const metaAndValidators = await this.validatorsRegistry.getValidators();

    return metaAndValidators;
  }
}
