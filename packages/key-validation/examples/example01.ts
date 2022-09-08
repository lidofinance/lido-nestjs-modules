import { Module } from '@nestjs/common';
import { KeyValidatorModule } from '../src/key-validator.module';
import { Key, KeyValidatorInterface } from '../src/interfaces';

export class Example01Service {
  public constructor(private readonly keyValidator: KeyValidatorInterface) {}

  public async doSmth() {
    const key: Key = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      withdrawalCredentials: Buffer.alloc(32),
      genesisForkVersion: Buffer.alloc(32),
    };

    return await this.keyValidator.validateKeys([key]);
  }
}

@Module({
  imports: [KeyValidatorModule.forFeature()],
  providers: [Example01Service],
})
export class ExampleModule01 {}
