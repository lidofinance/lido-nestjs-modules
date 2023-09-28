import { Module } from '@nestjs/common';
import {
  ORACLE_REPORT_SANITY_CHECKER_TOKEN,
  ORACLE_REPORT_SANITY_CHECKER_ADDRESSES,
} from './oracle-report-sanity-checker.constants';
import { OracleReportSanityChecker__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class OracleReportSanityCheckerModule extends ContractModule {
  static module = OracleReportSanityCheckerModule;
  static contractFactory = OracleReportSanityChecker__factory;
  static contractToken = ORACLE_REPORT_SANITY_CHECKER_TOKEN;
  static defaultAddresses = ORACLE_REPORT_SANITY_CHECKER_ADDRESSES;
}
