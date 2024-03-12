#!/usr/bin/env node
// @see https://en.wikipedia.org/wiki/Unit_testing
// @description:
// Run all specification tests whose extension name is `.spec.ts` in the `lib` directory.
// This script is part of the project test

const { execSync } = require('./uitl');
const { transformMochaArgs } = require('./util-for-mocha');

execSync(['node', 'scripts/build-cjs']);

const args = transformMochaArgs('dist/cjs', process.argv.slice(2));
if (args.mocha.includes('--watch')) {
  args.mocha.push('--file', 'scripts/build-cjs');
  if (!args.mocha.includes('--watch-files'))
    args.mocha.push('--watch-files', 'lib/**/*.ts');
}

if (args.rest.length === 0) args.rest.push('dist/cjs/**/*.spec.js');

const allArgs = [...args.mocha, ...args.rest];
execSync(
  args.node.length > 0
    ? ['node', ...args.node, './node_modules/.bin/mocha', ...allArgs]
    : ['mocha', ...allArgs],
);
