#!/usr/bin/env node

const { resolve } = require('path');
const { execSync } = require('./uitl');

const extraArgs = [];
if (/^(0|off|no|false)$/i.test(process.env.MINIFICATION_ENABLED)) {
  console.warn('Minification is disabled');
  extraArgs.push('--config', 'minify=false');
}

/**
 * @see https://swc.rs/docs/usage/cli
 */
execSync([
  'swc',
  'lib',
  '--out-dir',
  'dist/esm',
  '--no-swcrc',
  '--config-file',
  resolve(__dirname, 'build-esm.swcrc'),
  ...extraArgs,
  ...process.argv.slice(2),
]);
