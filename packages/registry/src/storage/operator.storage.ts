import { Injectable } from '@nestjs/common';
import { RegistryOperator } from './operator.entity';
import { EntityManager } from '@mikro-orm/sqlite';

@Injectable()
export class RegistryOperatorStorageService {
  constructor(private readonly em: EntityManager) {}

  /** find all operators */
  async findAll(): Promise<RegistryOperator[]> {
    return await this.em.getRepository(RegistryOperator).findAll();
  }

  /** find operator by index */
  async findOneByIndex(
    operatorIndex: number,
  ): Promise<RegistryOperator | null> {
    return await this.em
      .getRepository(RegistryOperator)
      .findOne({ index: operatorIndex });
  }

  /** removes operator by index */
  async removeOneByIndex(operatorIndex: number) {
    return await this.em
      .getRepository(RegistryOperator)
      .nativeDelete({ index: operatorIndex });
  }

  /** removes all operators */
  async removeAll() {
    return await this.em.getRepository(RegistryOperator).nativeDelete({});
  }

  /** saves operator to storage */
  async saveOne(operator: RegistryOperator) {
    const repository = this.em.getRepository(RegistryOperator);
    const key = new RegistryOperator(operator);
    return await repository.persistAndFlush(key);
  }

  /** saves multiply operators to storage */
  async save(operators: RegistryOperator[]) {
    const repository = this.em.getRepository(RegistryOperator);

    await Promise.all(
      operators.map(async (operator) => {
        const key = new RegistryOperator(operator);
        return await repository.persist(key);
      }),
    );

    repository.flush();
  }
}
