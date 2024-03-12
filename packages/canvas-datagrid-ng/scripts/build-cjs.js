#!/usr/bin/env node

const { execSync } = require('./uitl');

/**
 * @see https://swc.rs/docs/usage/cli
 */
execSync([
  'swc',
  'lib',
  '--out-dir',
  'dist/cjs',
  '--no-swcrc',
  '--source-maps',
  '--config',
  'module.type=commonjs',
  '--config',
  'jsc.parser.syntax=typescript',
  '--config',
  'jsc.target=es2020',
  '--config',
  'minify=false',
]);
