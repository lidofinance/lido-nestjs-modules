import path from 'path';
import fs from 'fs';
import tslib from 'tslib';
import ts from 'typescript';
import glob from 'glob';
import {
  topologicallySort,
  listWorkspaces,
} from '@lidofinance/yarn-workspaces-list';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import resolve from '@rollup/plugin-node-resolve';

const excludedWorkspaces = ['.'];
const extensions = ['.ts', '.d.ts'];
const commonExternal = [];

const errors = {
  MIGRATION_FILENAME_WRONG: (filePath, filenameRegExp) =>
    `Migration file name '${filePath}' does not comply with the pattern '${filenameRegExp}'`,
  MIGRATION_FILE_CLASSNAME_WRONG: (filePath, classname) =>
    `Migration file '${filePath}' does not export class with correct name. Class name should be equal to file name. ` +
    `Expected class name: '${classname}'.`,
};

export default async () => {
  const packages = await listWorkspaces();
  const filteredPackages = packages.filter(
    ({ location }) => !excludedWorkspaces.includes(location),
  );
  const sortedPackages = topologicallySort(filteredPackages);

  const checkMigrationFile = (filePath) => {
    const filenameRegExp = /Migration[0-9]{14}\.ts$/; // PLEASE DO NOT CHANGE THAT
    const ext = path.extname(filePath);
    const filename = path.basename(filePath, ext);
    const contentRegExp = new RegExp(
      `^export\\s*class\\s*${filename}\\s*extends\\s*Migration`,
      'm',
    ); // PLEASE DO NOT CHANGE THAT

    if (filePath.match(filenameRegExp) === null) {
      throw new Error(
        errors.MIGRATION_FILENAME_WRONG(filePath, filenameRegExp),
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (content.match(contentRegExp) === null) {
      throw new Error(
        errors.MIGRATION_FILE_CLASSNAME_WRONG(filePath, filename),
      );
    }
  };

  const getMigrationPaths = (packageDir) => {
    const migrationsPath = path.join(__dirname, packageDir, 'src/migrations');
    const migrationFileGlobPattern = 'Migration*.ts';
    const migrationFilePaths = glob
      .sync(migrationFileGlobPattern, {
        cwd: migrationsPath,
      })
      .map((_) => path.join(migrationsPath, _));

    migrationFilePaths.forEach((filePath) => {
      checkMigrationFile(filePath);
    });

    return migrationFilePaths;
  };

  const config = sortedPackages.map((packageData) => {
    const packageDir = packageData.location;
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8'),
    );
    const { dependencies, peerDependencies } = packageJson;
    const external = [
      ...commonExternal,
      ...Object.keys({ ...dependencies, ...peerDependencies }),
    ];

    const cjsDir = path.join(packageDir, path.dirname(packageJson.main));

    const entrypoint = path.join(packageDir, 'src/index');
    const migrationFilePaths = getMigrationPaths(packageDir);
    const inputs = [entrypoint, ...migrationFilePaths];

    return {
      input: inputs,
      output: [
        {
          dir: cjsDir,
          preserveModulesRoot: path.join(packageDir, 'src'),
          preserveModules: true,
          format: 'cjs',
          exports: 'named',
        },
      ],
      plugins: [
        del({ targets: path.join(packageDir, 'dist/*'), runOnce: true }),
        resolve({ extensions }),
        typescript({
          tslib,
          typescript: ts,
          tsconfig: path.join(packageDir, 'tsconfig.json'),
          tsconfigOverride: {
            compilerOptions: {
              paths: { tslib: [require.resolve('tslib/tslib.d.ts')] },
            },
            exclude: ['node_modules', 'dist', '**/*.spec.ts'],
            include: ['src/**/*'],
          },
        }),
      ],
      external,
    };
  });

  return config;
};
